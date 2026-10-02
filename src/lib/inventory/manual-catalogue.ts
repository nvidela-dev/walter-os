export interface ManualCandidate {
  id: string;
  page: number;
  section: string;
  name: string;
  transcription: string;
  question: string;
}

// One fixed source: the two handwritten pages supplied by the user.
const sections: [number, string, [string, string, string?][]][] = [
  [1, "Pasta", [
    ["Ñoquis mixtos", "Ñoquis mixtos - 2"], ["Ñoquis de papa", "〃 papas - 7"],
    ["Ñoquis de morrón", "〃 morrón - HAY"], ["Ñoquis de espinaca", "〃 espinaca - 6"],
    ["Sorrentinos de calabaza", "Sorrentinos calabaza - HAY"],
    ["Sorrentinos de jamón y queso", "〃 JyQ - 1", "¿JyQ significa jamón y queso?"],
    ["Sorrentinos de verdura", "〃 verdura - HAY"],
    ["Sorrentinos de bondiola y cuatro quesos", "〃 bondiola 4C - 6", "¿El relleno es bondiola y cuatro quesos?"],
    ["Sorrentinos de lomito y nuez", "〃 lomito y nuez - símbolo circulado", "Confirmá el relleno y el símbolo."],
    ["Arrolladitos primavera", "Arrolladitos primavera - HAY"], ["Bastones", "Bastones - HAY", "¿Bastones de qué?"],
    ["Aros de cebolla", "Aros cebollas - HAY"], ["Papas rebozadas", "Papas rebozadas - 3"],
    ["Nuggets", "Nuggets - HAY"], ["Ravioles de jamón y queso", "Ravioles JyQ - 1/2", "¿JyQ significa jamón y queso?"],
    ["Ravioles de verdura", "〃 verdura - 1/2"],
  ]],
  [1, "Secos", [
    ["Cheddar", "Cheddar - 1"], ["Cuatro quesos", "4 quesos - 1", "¿Qué producto o presentación es?"],
    ["Aceite de freidora", "Aceite freidora - 1"], ["Aceite común", "〃 común - 2"],
    ["Tallarín", "Tallarín - 1"], ["Mayonesa", "Mayonesa - 3"], ["Mostaza", "Mostaza - 1"],
    ["Ketchup", "Ketchup - 2"], ["Ananá", "Ananá - 2"], ["Duraznos", "Duraznos - 3"],
    ["Champiñones", "Champiñones - 1"], ["Arroz", "Arroz - 1 K"], ["Atún", "Atún - HAY"],
    ["Maní", "Maní - HA…", "¿La anotación dice HAY?"],
    ["Cerezas", "Cerezas - símbolo circulado · pocas", "Confirmá el nombre y el símbolo."],
    ["Sal fina", "Sal fina - 1 abierta · símbolo circulado"], ["Sal gruesa", "↳ gruesa - 1"],
    ["Aceitunas", "Aceitunas - 1 abierta · símbolo circulado"],
    ["Puré", "Puré - 1/4 · símbolo circulado", "¿Puré de papa? ¿En qué presentación?"], ["Azúcar", "Azúcar - 2 K"],
  ]],
  [2, "Carne", [
    ["Carne picada", "Picada - 2"], ["Entrecot", "Entrecot - 1"], ["Supremas", "Supremas - 1 entera"],
    ["Milanesas de pollo", "Mila pollo - 4"], ["Milanesas de carne", "〃 carne - 13"],
    ["Milanesas de pescado", "〃 pescado - HAY"], ["Kassler", "Kassler - HAY", "Confirmá el nombre."],
    ["Salchichas", "Salchichas - HAY"], ["Panchos", "Panchos - HAY", "¿Son un producto distinto de las salchichas?"],
  ]],
  [2, "Freezer rectangular", [
    ["Mix de morrones", "Mix morrones - 1 1/4"], ["Pollo picado", "Pollo picado - 1/4 · símbolo circulado"],
    ["Espinaca", "Espinaca - 1 1/2"], ["Ensalada rusa", "Rusa - 1 1/4", "¿Es mix de verduras para ensalada rusa?"],
    ["Choclo", "Choclo - 3/4"], ["Arvejas", "Arvejas - tachado · 1"],
    ["Zapallitos", "Zapallitos - símbolo circulado"], ["Cebolla picada", "Cebolla picada - HAY"], ["Brócoli", "Brócoli - 1/2"],
  ]],
  [2, "Fritas", [
    ["Papas rústicas", "Rústicas - símbolo circulado · ?"],
    ["Papas españolas", "Españolas - 2 1/2 (Steam …)", "Confirmá el texto entre paréntesis y la presentación."],
    ["Papas noisettes", "Noisettes - 1/2 · símbolo circulado · ?"], ["Papas fritas", "Fritas - 7"],
  ]],
  [2, "Pizzas", [
    ["Pizzas redondas", "Pizzas redondas - HAY"], ["Pizzas rectangulares", "〃 rectangulares - HAY"], ["Pizzetas", "Pizzetas - HAY"],
    ["Tortugas de queso", "Tortugas queso - 32", "Confirmá el nombre del producto."], ["Canadiense", "Canadiense - 9", "¿Qué producto es: pan, preparación u otro?"],
    ["Pan marmolado", "Pan marmolado - 1 1/2"], ["Pan de nuez", "〃 nuez - 1 1/2"],
    ["Pan blanco", "〃 blanco - símbolo circulado"], ["Pizzas de avena", "Pizzas avena - 6"],
  ]],
  [2, "Celíaco", [
    ["Pan de molde sin gluten", "Molde - 1", "¿Es pan de molde sin gluten?"], ["Pizzas sin gluten", "Pizzas - 5"],
    ["Tortugas sin gluten", "Tortugas - 6"], ["Crepes sin gluten", "Creps - HAY", "Confirmá si dice crepes."], ["Sorrentinos sin gluten", "Sorrentinos - HAY"],
  ]],
];

export const manualCandidates: ManualCandidate[] = sections.flatMap(([page, section, rows], sectionIndex) => rows.map(([name, transcription, question], rowIndex) => ({
  id: `${sectionIndex}-${rowIndex}`, page, section, name, transcription,
  question: question ?? "Confirmá el nombre, la unidad de inventario y dónde se guarda.",
})));
