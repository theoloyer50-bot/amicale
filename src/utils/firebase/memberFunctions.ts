export const MEMBER_FUNCTIONS = [
  { value: 'spp', acronym: 'SPP', description: 'Sapeurs Pompiers Professionnels' },
  { value: 'spv', acronym: 'SPV', description: 'Sapeurs Pompiers Volontaires' },
  { value: 'anciens-sp', acronym: 'Anciens SP', description: 'Anciens Sapeurs Pompiers' },
  { value: 'sssm', acronym: 'SSSM', description: 'Service de Santé et de Secours Médical' },
  { value: 'pats', acronym: 'PATS', description: 'Personnels Administratifs, Techniques et Spécialisés' },
] as const;

export type MemberFunction = typeof MEMBER_FUNCTIONS[number]['value'];
export type MemberFunctionCounts = Record<MemberFunction, number>;

export function isMemberFunction(value: unknown): value is MemberFunction {
  return MEMBER_FUNCTIONS.some((memberFunction) => memberFunction.value === value);
}

export function createEmptyMemberFunctionCounts(): MemberFunctionCounts {
  return {
    spp: 0,
    spv: 0,
    'anciens-sp': 0,
    sssm: 0,
    pats: 0,
  };
}

export function countMemberFunctions(
  accounts: readonly { status: string; fonction?: MemberFunction }[]
): MemberFunctionCounts {
  const counts = createEmptyMemberFunctionCounts();

  accounts.forEach((account) => {
    if (account.status === 'approved' && account.fonction) {
      counts[account.fonction] += 1;
    }
  });

  return counts;
}
