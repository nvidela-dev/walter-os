--
-- PostgreSQL database dump
--

\restrict KdTboQJIrntT8KoW1cptnrwIRZr7EsO1Ht16W7wcEUz4XHc6g3GXAKsJ25LFMyi

-- Dumped from database version 17.11 (7d7ea2a)
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: proveedor_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.proveedor_tipo AS ENUM (
    'producto',
    'servicio'
);


--
-- Name: bebidas_snapshot(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bebidas_snapshot() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE current_unit text;
BEGIN
  -- Only database time determines the active week; snapshots remain historical.
  NEW.registrado_at := now();
  NEW.semana := public.inventory_week((NEW.registrado_at AT TIME ZONE 'America/Montevideo')::date);
  SELECT p.nombre, p.unidad, b.ubicacion INTO NEW.nombre, current_unit, NEW.ubicacion
    FROM public.inventario_bebidas_productos b JOIN public.productos p ON p.id=b.producto_id
    WHERE b.id=NEW.item_id AND b.activo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Drink item is not active'; END IF;
  IF NEW.unidad <> current_unit THEN RAISE EXCEPTION 'Drink unit changed; reload before counting'; END IF;
  RETURN NEW;
END;
$$;


--
-- Name: impedir_cambio_observacion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.impedir_cambio_observacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION 'Inventory observations are append-only';
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: observaciones_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.observaciones_inventario (
    id bigint NOT NULL,
    heladera_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    cantidad numeric(12,2) NOT NULL,
    unidad text NOT NULL,
    registrado_at timestamp with time zone DEFAULT now() NOT NULL,
    registrado_por text NOT NULL,
    CONSTRAINT observaciones_cantidad_nonnegative CHECK (((cantidad >= (0)::numeric) AND (cantidad < ('10000000000'::bigint)::numeric)))
);


--
-- Name: inventory_record_run(public.observaciones_inventario); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.inventory_record_run(o public.observaciones_inventario) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  run_id bigint;
  prior_id bigint;
  run_day date := public.inventory_week((o.registrado_at AT TIME ZONE 'America/Montevideo')::date);
  prior_quantity numeric;
  prior_unit text;
BEGIN
  -- Serialize concurrent Kitchen saves so every week has one coherent run.
  PERFORM pg_advisory_xact_lock(1790806168);
  INSERT INTO public.inventarios(fecha) VALUES(run_day)
    ON CONFLICT(fecha) DO UPDATE SET fecha=EXCLUDED.fecha RETURNING id INTO run_id;
  SELECT id INTO prior_id FROM public.inventarios WHERE fecha < run_day ORDER BY fecha DESC LIMIT 1;
  SELECT cantidad, unidad INTO prior_quantity, prior_unit FROM public.inventario_items
    WHERE inventario_id=prior_id AND heladera_id=o.heladera_id AND producto_id=o.producto_id;
  INSERT INTO public.inventario_items(inventario_id,heladera_id,producto_id,heladera_numero,heladera_nombre,producto_nombre,nota,cantidad,unidad,cambio,registrado_at,observacion_id)
    SELECT run_id,o.heladera_id,o.producto_id,h.numero,h.nombre,p.nombre,hp.nota,o.cantidad,o.unidad,
      CASE WHEN prior_unit=o.unidad THEN o.cantidad-prior_quantity ELSE NULL END,o.registrado_at,o.id
    FROM public.heladeras h JOIN public.heladera_productos hp ON hp.heladera_id=h.id
      JOIN public.productos p ON p.id=hp.producto_id
    WHERE h.id=o.heladera_id AND p.id=o.producto_id
    ON CONFLICT(inventario_id,heladera_id,producto_id) DO UPDATE SET
      heladera_numero=EXCLUDED.heladera_numero,heladera_nombre=EXCLUDED.heladera_nombre,
      producto_nombre=EXCLUDED.producto_nombre,nota=EXCLUDED.nota,cantidad=EXCLUDED.cantidad,
      unidad=EXCLUDED.unidad,cambio=EXCLUDED.cambio,registrado_at=EXCLUDED.registrado_at,observacion_id=EXCLUDED.observacion_id
    WHERE EXCLUDED.registrado_at > inventario_items.registrado_at OR
      (EXCLUDED.registrado_at=inventario_items.registrado_at AND EXCLUDED.observacion_id>inventario_items.observacion_id);
END;
$$;


--
-- Name: inventory_run_on_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.inventory_run_on_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM public.inventory_record_run(NEW);
  RETURN NEW;
END;
$$;


--
-- Name: inventory_target_immutable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.inventory_target_immutable() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION 'Inventory target history is append-only';
END;
$$;


--
-- Name: inventory_target_on_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.inventory_target_on_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO public.objetivos_inventario_activos(producto_id,objetivo_id) VALUES(NEW.producto_id,NEW.id)
    ON CONFLICT(producto_id) DO UPDATE SET objetivo_id=EXCLUDED.objetivo_id
    WHERE EXCLUDED.objetivo_id > objetivos_inventario_activos.objetivo_id;
  RETURN NEW;
END;
$$;


--
-- Name: inventory_week(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.inventory_week(day date) RETURNS date
    LANGUAGE sql IMMUTABLE STRICT
    AS $$ SELECT day - ((extract(dow FROM day)::integer + 5) % 7); $$;


--
-- Name: show_db_tree(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.show_db_tree() RETURNS TABLE(tree_structure text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- First show all databases
    RETURN QUERY
    SELECT ':file_folder: ' || datname || ' (DATABASE)'
    FROM pg_database 
    WHERE datistemplate = false;

    -- Then show current database structure
    RETURN QUERY
    WITH RECURSIVE 
    -- Get schemas
    schemas AS (
        SELECT 
            n.nspname AS object_name,
            1 AS level,
            n.nspname AS path,
            'SCHEMA' AS object_type
        FROM pg_namespace n
        WHERE n.nspname NOT LIKE 'pg_%' 
        AND n.nspname != 'information_schema'
    ),

    -- Get all objects (tables, views, functions, etc.)
    objects AS (
        SELECT 
            c.relname AS object_name,
            2 AS level,
            s.path || ' → ' || c.relname AS path,
            CASE c.relkind
                WHEN 'r' THEN 'TABLE'
                WHEN 'v' THEN 'VIEW'
                WHEN 'm' THEN 'MATERIALIZED VIEW'
                WHEN 'i' THEN 'INDEX'
                WHEN 'S' THEN 'SEQUENCE'
                WHEN 'f' THEN 'FOREIGN TABLE'
            END AS object_type
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN schemas s ON n.nspname = s.object_name
        WHERE c.relkind IN ('r','v','m','i','S','f')

        UNION ALL

        SELECT 
            p.proname AS object_name,
            2 AS level,
            s.path || ' → ' || p.proname AS path,
            'FUNCTION' AS object_type
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        JOIN schemas s ON n.nspname = s.object_name
    ),

    -- Combine schemas and objects
    combined AS (
        SELECT * FROM schemas
        UNION ALL
        SELECT * FROM objects
    )

    -- Final output with tree-like formatting
    SELECT 
        REPEAT('    ', level) || 
        CASE 
            WHEN level = 1 THEN '└── :open_file_folder: '
            ELSE '    └── ' || 
                CASE object_type
                    WHEN 'TABLE' THEN ':bar_chart: '
                    WHEN 'VIEW' THEN ':eye: '
                    WHEN 'MATERIALIZED VIEW' THEN ':newspaper: '
                    WHEN 'FUNCTION' THEN ':zap: '
                    WHEN 'INDEX' THEN ':mag: '
                    WHEN 'SEQUENCE' THEN ':1234: '
                    WHEN 'FOREIGN TABLE' THEN ':globe_with_meridians: '
                    ELSE ''
                END
        END || object_name || ' (' || object_type || ')'
    FROM combined
    ORDER BY path;
END;
$$;


--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: empleados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empleados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    horas_fijas_semanales integer DEFAULT 40 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    tarifa_hora numeric(10,2) NOT NULL,
    tarifa_hora_extra numeric(10,2) NOT NULL,
    CONSTRAINT empleados_tarifa_hora_extra_positive CHECK ((tarifa_hora_extra > (0)::numeric)),
    CONSTRAINT empleados_tarifa_hora_positive CHECK ((tarifa_hora > (0)::numeric))
);


--
-- Name: equivalencias_productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equivalencias_productos (
    inventario_producto_id uuid NOT NULL,
    catalogo_producto_id uuid NOT NULL,
    estado text NOT NULL,
    revisado_por text NOT NULL,
    revisado_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT equivalencias_estado CHECK ((estado = ANY (ARRAY['accepted'::text, 'rejected'::text])))
);


--
-- Name: factura_lineas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factura_lineas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    factura_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    unidad_id uuid NOT NULL,
    precio_unit numeric(10,2) NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: facturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proveedor_id uuid NOT NULL,
    fecha date NOT NULL,
    numero text,
    total numeric(12,2) NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    notas text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    monto numeric(12,2)
);


--
-- Name: heladera_productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.heladera_productos (
    heladera_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    nota text
);


--
-- Name: heladeras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.heladeras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero integer NOT NULL,
    nombre text,
    activa boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    comentario text,
    CONSTRAINT heladeras_numero_positive CHECK ((numero > 0))
);


--
-- Name: historial_objetivos_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_objetivos_inventario (
    id bigint NOT NULL,
    producto_id uuid NOT NULL,
    cantidad numeric(12,2) NOT NULL,
    unidad text NOT NULL,
    registrado_at timestamp with time zone DEFAULT now() NOT NULL,
    registrado_por text NOT NULL,
    CONSTRAINT objetivos_cantidad_nonnegative CHECK (((cantidad >= (0)::numeric) AND (cantidad < ('10000000000'::bigint)::numeric)))
);


--
-- Name: historial_objetivos_inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.historial_objetivos_inventario ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.historial_objetivos_inventario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: historial_precios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_precios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    producto_id uuid NOT NULL,
    proveedor_id uuid NOT NULL,
    precio numeric(10,2) NOT NULL,
    unidad_id uuid NOT NULL,
    factura_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: horas_extra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horas_extra (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empleado_id uuid NOT NULL,
    fecha date NOT NULL,
    horas integer NOT NULL,
    monto_pagado numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: inventario_bebidas_productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventario_bebidas_productos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    producto_id uuid NOT NULL,
    ubicacion text NOT NULL,
    cantidad_objetivo numeric(12,2),
    unidad_objetivo text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bebidas_objetivo_nonnegative CHECK (((cantidad_objetivo >= (0)::numeric) AND (cantidad_objetivo < ('10000000000'::bigint)::numeric))),
    CONSTRAINT bebidas_objetivo_unit_pair CHECK (((cantidad_objetivo IS NULL) = (unidad_objetivo IS NULL)))
);


--
-- Name: inventario_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventario_items (
    inventario_id bigint NOT NULL,
    heladera_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    heladera_numero integer NOT NULL,
    heladera_nombre text,
    producto_nombre text NOT NULL,
    nota text,
    cantidad numeric(12,2) NOT NULL,
    unidad text NOT NULL,
    cambio numeric(13,2),
    registrado_at timestamp with time zone NOT NULL,
    observacion_id bigint NOT NULL
);


--
-- Name: inventarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventarios (
    id bigint NOT NULL,
    fecha date NOT NULL,
    CONSTRAINT inventarios_fecha_tuesday CHECK ((EXTRACT(dow FROM fecha) = (2)::numeric))
);


--
-- Name: inventarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.inventarios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.inventarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: menu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    precio_venta numeric(10,2) NOT NULL,
    receta_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: objetivos_inventario_activos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.objetivos_inventario_activos (
    producto_id uuid NOT NULL,
    objetivo_id bigint NOT NULL
);


--
-- Name: observaciones_bebidas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.observaciones_bebidas (
    id bigint NOT NULL,
    item_id uuid NOT NULL,
    semana date DEFAULT public.inventory_week(((now() AT TIME ZONE 'America/Montevideo'::text))::date) NOT NULL,
    nombre text NOT NULL,
    ubicacion text NOT NULL,
    cantidad numeric(12,2) NOT NULL,
    unidad text NOT NULL,
    registrado_at timestamp with time zone DEFAULT now() NOT NULL,
    registrado_por text NOT NULL,
    CONSTRAINT bebidas_cantidad_nonnegative CHECK (((cantidad >= (0)::numeric) AND (cantidad < ('10000000000'::bigint)::numeric))),
    CONSTRAINT bebidas_semana_tuesday CHECK ((EXTRACT(dow FROM semana) = (2)::numeric))
);


--
-- Name: observaciones_bebidas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.observaciones_bebidas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.observaciones_bebidas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: observaciones_inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.observaciones_inventario ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.observaciones_inventario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.productos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    unidad text DEFAULT 'unidad'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    unidad_id uuid
);


--
-- Name: proveedor_productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedor_productos (
    proveedor_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    precio numeric(10,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    cantidad numeric(10,2) DEFAULT '1'::numeric NOT NULL
);


--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    logo_url text,
    deuda numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    dias text,
    tipo public.proveedor_tipo DEFAULT 'producto'::public.proveedor_tipo NOT NULL
);


--
-- Name: receta_productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receta_productos (
    receta_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    cantidad numeric(10,3) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: recetas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recetas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: unidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text NOT NULL,
    nombre text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: usuarios_autorizados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios_autorizados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: usuarios_bebidas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios_bebidas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: usuarios_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios_inventario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: inventario_bebidas_productos bebidas_producto_ubicacion_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_bebidas_productos
    ADD CONSTRAINT bebidas_producto_ubicacion_unique UNIQUE (producto_id, ubicacion);


--
-- Name: empleados empleados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_pkey PRIMARY KEY (id);


--
-- Name: equivalencias_productos equivalencias_productos_inventario_producto_id_catalogo_product; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equivalencias_productos
    ADD CONSTRAINT equivalencias_productos_inventario_producto_id_catalogo_product PRIMARY KEY (inventario_producto_id, catalogo_producto_id);


--
-- Name: factura_lineas factura_lineas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_lineas
    ADD CONSTRAINT factura_lineas_pkey PRIMARY KEY (id);


--
-- Name: facturas facturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_pkey PRIMARY KEY (id);


--
-- Name: heladera_productos heladera_productos_heladera_id_producto_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heladera_productos
    ADD CONSTRAINT heladera_productos_heladera_id_producto_id_pk PRIMARY KEY (heladera_id, producto_id);


--
-- Name: heladeras heladeras_numero_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heladeras
    ADD CONSTRAINT heladeras_numero_unique UNIQUE (numero);


--
-- Name: heladeras heladeras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heladeras
    ADD CONSTRAINT heladeras_pkey PRIMARY KEY (id);


--
-- Name: historial_objetivos_inventario historial_objetivos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_objetivos_inventario
    ADD CONSTRAINT historial_objetivos_inventario_pkey PRIMARY KEY (id);


--
-- Name: historial_precios historial_precios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_precios
    ADD CONSTRAINT historial_precios_pkey PRIMARY KEY (id);


--
-- Name: horas_extra horas_extra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horas_extra
    ADD CONSTRAINT horas_extra_pkey PRIMARY KEY (id);


--
-- Name: inventario_bebidas_productos inventario_bebidas_productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_bebidas_productos
    ADD CONSTRAINT inventario_bebidas_productos_pkey PRIMARY KEY (id);


--
-- Name: inventario_items inventario_items_inventario_id_heladera_id_producto_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_items
    ADD CONSTRAINT inventario_items_inventario_id_heladera_id_producto_id_pk PRIMARY KEY (inventario_id, heladera_id, producto_id);


--
-- Name: inventarios inventarios_fecha_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventarios
    ADD CONSTRAINT inventarios_fecha_unique UNIQUE (fecha);


--
-- Name: inventarios inventarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventarios
    ADD CONSTRAINT inventarios_pkey PRIMARY KEY (id);


--
-- Name: menu menu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu
    ADD CONSTRAINT menu_pkey PRIMARY KEY (id);


--
-- Name: historial_objetivos_inventario objetivos_id_product_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_objetivos_inventario
    ADD CONSTRAINT objetivos_id_product_unique UNIQUE (id, producto_id);


--
-- Name: objetivos_inventario_activos objetivos_inventario_activos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.objetivos_inventario_activos
    ADD CONSTRAINT objetivos_inventario_activos_pkey PRIMARY KEY (producto_id);


--
-- Name: observaciones_bebidas observaciones_bebidas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.observaciones_bebidas
    ADD CONSTRAINT observaciones_bebidas_pkey PRIMARY KEY (id);


--
-- Name: observaciones_inventario observaciones_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.observaciones_inventario
    ADD CONSTRAINT observaciones_inventario_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: proveedor_productos proveedor_productos_proveedor_id_producto_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedor_productos
    ADD CONSTRAINT proveedor_productos_proveedor_id_producto_id_pk PRIMARY KEY (proveedor_id, producto_id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: receta_productos receta_productos_receta_id_producto_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receta_productos
    ADD CONSTRAINT receta_productos_receta_id_producto_id_pk PRIMARY KEY (receta_id, producto_id);


--
-- Name: recetas recetas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recetas
    ADD CONSTRAINT recetas_pkey PRIMARY KEY (id);


--
-- Name: unidades unidades_codigo_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_codigo_unique UNIQUE (codigo);


--
-- Name: unidades unidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_pkey PRIMARY KEY (id);


--
-- Name: usuarios_autorizados usuarios_autorizados_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_autorizados
    ADD CONSTRAINT usuarios_autorizados_email_unique UNIQUE (email);


--
-- Name: usuarios_autorizados usuarios_autorizados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_autorizados
    ADD CONSTRAINT usuarios_autorizados_pkey PRIMARY KEY (id);


--
-- Name: usuarios_bebidas usuarios_bebidas_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_bebidas
    ADD CONSTRAINT usuarios_bebidas_email_unique UNIQUE (email);


--
-- Name: usuarios_bebidas usuarios_bebidas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_bebidas
    ADD CONSTRAINT usuarios_bebidas_pkey PRIMARY KEY (id);


--
-- Name: usuarios_inventario usuarios_inventario_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_inventario
    ADD CONSTRAINT usuarios_inventario_email_unique UNIQUE (email);


--
-- Name: usuarios_inventario usuarios_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_inventario
    ADD CONSTRAINT usuarios_inventario_pkey PRIMARY KEY (id);


--
-- Name: bebidas_latest_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bebidas_latest_idx ON public.observaciones_bebidas USING btree (semana, item_id, registrado_at DESC NULLS LAST, id DESC NULLS LAST);


--
-- Name: objetivos_history_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX objetivos_history_idx ON public.historial_objetivos_inventario USING btree (producto_id, id DESC NULLS LAST);


--
-- Name: observaciones_latest_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX observaciones_latest_idx ON public.observaciones_inventario USING btree (heladera_id, producto_id, registrado_at DESC NULLS LAST, id DESC NULLS LAST);


--
-- Name: observaciones_bebidas bebidas_observaciones_inmutables; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bebidas_observaciones_inmutables BEFORE DELETE OR UPDATE ON public.observaciones_bebidas FOR EACH ROW EXECUTE FUNCTION public.impedir_cambio_observacion();


--
-- Name: observaciones_bebidas bebidas_snapshot_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bebidas_snapshot_insert BEFORE INSERT ON public.observaciones_bebidas FOR EACH ROW EXECUTE FUNCTION public.bebidas_snapshot();


--
-- Name: historial_objetivos_inventario objetivos_actualizar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER objetivos_actualizar AFTER INSERT ON public.historial_objetivos_inventario FOR EACH ROW EXECUTE FUNCTION public.inventory_target_on_insert();


--
-- Name: historial_objetivos_inventario objetivos_inmutables; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER objetivos_inmutables BEFORE DELETE OR UPDATE ON public.historial_objetivos_inventario FOR EACH ROW EXECUTE FUNCTION public.inventory_target_immutable();


--
-- Name: observaciones_inventario observaciones_inmutables; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER observaciones_inmutables BEFORE DELETE OR UPDATE ON public.observaciones_inventario FOR EACH ROW EXECUTE FUNCTION public.impedir_cambio_observacion();


--
-- Name: observaciones_inventario observaciones_inventario_run; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER observaciones_inventario_run AFTER INSERT ON public.observaciones_inventario FOR EACH ROW EXECUTE FUNCTION public.inventory_run_on_count();


--
-- Name: equivalencias_productos equivalencias_productos_catalogo_producto_id_productos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equivalencias_productos
    ADD CONSTRAINT equivalencias_productos_catalogo_producto_id_productos_id_fk FOREIGN KEY (catalogo_producto_id) REFERENCES public.productos(id) ON DELETE RESTRICT;


--
-- Name: equivalencias_productos equivalencias_productos_inventario_producto_id_productos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equivalencias_productos
    ADD CONSTRAINT equivalencias_productos_inventario_producto_id_productos_id_fk FOREIGN KEY (inventario_producto_id) REFERENCES public.productos(id) ON DELETE RESTRICT;


--
-- Name: factura_lineas factura_lineas_factura_id_facturas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_lineas
    ADD CONSTRAINT factura_lineas_factura_id_facturas_id_fk FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON DELETE CASCADE;


--
-- Name: factura_lineas factura_lineas_producto_id_productos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_lineas
    ADD CONSTRAINT factura_lineas_producto_id_productos_id_fk FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE RESTRICT;


--
-- Name: factura_lineas factura_lineas_unidad_id_unidades_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_lineas
    ADD CONSTRAINT factura_lineas_unidad_id_unidades_id_fk FOREIGN KEY (unidad_id) REFERENCES public.unidades(id);


--
-- Name: facturas facturas_proveedor_id_proveedores_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_proveedor_id_proveedores_id_fk FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE CASCADE;


--
-- Name: heladera_productos heladera_productos_heladera_id_heladeras_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heladera_productos
    ADD CONSTRAINT heladera_productos_heladera_id_heladeras_id_fk FOREIGN KEY (heladera_id) REFERENCES public.heladeras(id) ON DELETE RESTRICT;


--
-- Name: heladera_productos heladera_productos_producto_id_productos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heladera_productos
    ADD CONSTRAINT heladera_productos_producto_id_productos_id_fk FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE RESTRICT;


--
-- Name: historial_objetivos_inventario historial_objetivos_inventario_producto_id_productos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_objetivos_inventario
    ADD CONSTRAINT historial_objetivos_inventario_producto_id_productos_id_fk FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE RESTRICT;


--
-- Name: historial_precios historial_precios_factura_id_facturas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_precios
    ADD CONSTRAINT historial_precios_factura_id_facturas_id_fk FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON DELETE SET NULL;


--
-- Name: historial_precios historial_precios_producto_id_productos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_precios
    ADD CONSTRAINT historial_precios_producto_id_productos_id_fk FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: historial_precios historial_precios_proveedor_id_proveedores_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_precios
    ADD CONSTRAINT historial_precios_proveedor_id_proveedores_id_fk FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE CASCADE;


--
-- Name: historial_precios historial_precios_unidad_id_unidades_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_precios
    ADD CONSTRAINT historial_precios_unidad_id_unidades_id_fk FOREIGN KEY (unidad_id) REFERENCES public.unidades(id);


--
-- Name: horas_extra horas_extra_empleado_id_empleados_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horas_extra
    ADD CONSTRAINT horas_extra_empleado_id_empleados_id_fk FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;


--
-- Name: inventario_bebidas_productos inventario_bebidas_productos_producto_id_productos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_bebidas_productos
    ADD CONSTRAINT inventario_bebidas_productos_producto_id_productos_id_fk FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE RESTRICT;


--
-- Name: inventario_items inventario_items_heladera_id_heladeras_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_items
    ADD CONSTRAINT inventario_items_heladera_id_heladeras_id_fk FOREIGN KEY (heladera_id) REFERENCES public.heladeras(id) ON DELETE RESTRICT;


--
-- Name: inventario_items inventario_items_inventario_id_inventarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_items
    ADD CONSTRAINT inventario_items_inventario_id_inventarios_id_fk FOREIGN KEY (inventario_id) REFERENCES public.inventarios(id) ON DELETE RESTRICT;


--
-- Name: inventario_items inventario_items_observacion_id_observaciones_inventario_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_items
    ADD CONSTRAINT inventario_items_observacion_id_observaciones_inventario_id_fk FOREIGN KEY (observacion_id) REFERENCES public.observaciones_inventario(id) ON DELETE RESTRICT;


--
-- Name: inventario_items inventario_items_producto_id_productos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventario_items
    ADD CONSTRAINT inventario_items_producto_id_productos_id_fk FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE RESTRICT;


--
-- Name: menu menu_receta_id_recetas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu
    ADD CONSTRAINT menu_receta_id_recetas_id_fk FOREIGN KEY (receta_id) REFERENCES public.recetas(id) ON DELETE SET NULL;


--
-- Name: objetivos_inventario_activos objetivos_inventario_activos_objetivo_id_producto_id_historial_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.objetivos_inventario_activos
    ADD CONSTRAINT objetivos_inventario_activos_objetivo_id_producto_id_historial_ FOREIGN KEY (objetivo_id, producto_id) REFERENCES public.historial_objetivos_inventario(id, producto_id) ON DELETE RESTRICT;


--
-- Name: observaciones_bebidas observaciones_bebidas_item_id_inventario_bebidas_productos_id_f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.observaciones_bebidas
    ADD CONSTRAINT observaciones_bebidas_item_id_inventario_bebidas_productos_id_f FOREIGN KEY (item_id) REFERENCES public.inventario_bebidas_productos(id) ON DELETE RESTRICT;


--
-- Name: observaciones_inventario observaciones_inventario_heladera_id_producto_id_heladera_produ; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.observaciones_inventario
    ADD CONSTRAINT observaciones_inventario_heladera_id_producto_id_heladera_produ FOREIGN KEY (heladera_id, producto_id) REFERENCES public.heladera_productos(heladera_id, producto_id) ON DELETE RESTRICT;


--
-- Name: productos productos_unidad_id_unidades_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_unidad_id_unidades_id_fk FOREIGN KEY (unidad_id) REFERENCES public.unidades(id);


--
-- Name: proveedor_productos proveedor_productos_producto_id_productos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedor_productos
    ADD CONSTRAINT proveedor_productos_producto_id_productos_id_fk FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: proveedor_productos proveedor_productos_proveedor_id_proveedores_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedor_productos
    ADD CONSTRAINT proveedor_productos_proveedor_id_proveedores_id_fk FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE CASCADE;


--
-- Name: receta_productos receta_productos_producto_id_productos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receta_productos
    ADD CONSTRAINT receta_productos_producto_id_productos_id_fk FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: receta_productos receta_productos_receta_id_recetas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receta_productos
    ADD CONSTRAINT receta_productos_receta_id_recetas_id_fk FOREIGN KEY (receta_id) REFERENCES public.recetas(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KdTboQJIrntT8KoW1cptnrwIRZr7EsO1Ht16W7wcEUz4XHc6g3GXAKsJ25LFMyi

