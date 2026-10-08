"use client";

import { type ReactElement, type SyntheticEvent, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { t } from "@/i18n";
import { setAccessGroup } from "@/lib/actions/access";
import { getFormString } from "@/lib/form";
import type { AccessMember } from "@/lib/queries/access";

export function AccessForm({ members }: { members: AccessMember[] }): ReactElement {
  const { error, isSubmitting, runAction } = useActionForm();
  const [email, setEmail] = useState("");
  const [group, setGroup] = useState("kitchen");
  const [saved, setSaved] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaved(false);
    const data = new FormData(event.currentTarget);
    const result = await runAction(() => setAccessGroup({ email: getFormString(data, "email"), group: getFormString(data, "group") }));
    if (result.ok) setSaved(true);
  }

  return <div className="space-y-5">
    <form onSubmit={(event) => void submit(event)} onChange={() => { setSaved(false); }} className="app-card space-y-4 rounded-2xl p-5">
      <p className="text-sm text-muted">{t.access.hint}</p>
      <fieldset disabled={isSubmitting} className="space-y-4">
        <label className="block">{t.access.email}
          <Input name="email" type="email" autoComplete="off" required maxLength={254} value={email} onChange={(event) => { setEmail(event.target.value); }} />
        </label>
        <label className="block">{t.access.group}
          <Select name="group" value={group} onChange={(event) => { setGroup(event.target.value); }}>
            <option value="kitchen">{t.access.kitchen}</option>
            <option value="admin">{t.access.admin}</option>
            <option value="none">{t.access.none}</option>
          </Select>
        </label>
        <Button type="submit" className="w-full">{t.access.save}</Button>
      </fieldset>
      <FormMessage message={error} />
      {saved && <p role="status" className="text-sm">{t.access.saved}</p>}
    </form>
    <ul className="space-y-2">
      {members.map((member) => <li key={member.email}>
        <button type="button" disabled={isSubmitting} onClick={() => { setEmail(member.email); setGroup(member.group); setSaved(false); }} className="app-card flex w-full flex-wrap justify-between gap-2 rounded-2xl p-4 text-left">
          <span className="break-all">{member.email}</span>
          <span className="text-sm text-muted">{member.group === "admin" ? t.access.admin : t.access.kitchen}</span>
        </button>
      </li>)}
    </ul>
    {members.length === 0 && <p>{t.access.empty}</p>}
  </div>;
}
