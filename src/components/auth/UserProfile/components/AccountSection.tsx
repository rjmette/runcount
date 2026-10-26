import React from 'react';

import { formatGameDateTime } from '../../../../utils/formatGameDate';
import { formatMemberSince } from '../utils/profileHelpers';

import { Field } from './Field';
import { SectionCard } from './SectionCard';

import type { AppUser } from '../../../../types/auth';

interface AccountSectionProps {
  user: AppUser;
  statsLoading: boolean;
  totalGames: number;
  lastGameDate: string | null;
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  user,
  statsLoading,
  totalGames,
  lastGameDate,
}) => (
  <SectionCard heading="Account">
    <dl className="divide-y divide-gray-100 dark:divide-gray-700">
      <Field label="Email">{user.email}</Field>
      <Field label="Member since">{formatMemberSince(user.created_at)}</Field>
      <Field label="Games played">{statsLoading ? '—' : totalGames}</Field>
      <Field label="Last game">
        {statsLoading ? '—' : lastGameDate ? formatGameDateTime(lastGameDate) : 'Never'}
      </Field>
    </dl>
  </SectionCard>
);
