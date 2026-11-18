import { useEffect, useState } from 'react';
import { Briefcase, Flame, Stethoscope } from 'lucide-react';
import { onValue, ref } from 'firebase/database';
import { firebaseDatabase } from '../utils/firebase/client';
import {
  MEMBER_FUNCTIONS,
  MemberFunctionCounts,
  createEmptyMemberFunctionCounts,
} from '../utils/firebase/memberFunctions';
import './MemberFunctionCounters.css';

export function MemberFunctionCounters() {
  const [counts, setCounts] = useState<MemberFunctionCounts | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const unsubscribe = onValue(
      ref(firebaseDatabase, 'kv/memberFunctionCounts'),
      (snapshot) => {
        const values = snapshot.val();
        const rawCounts: Record<string, unknown> =
          values && typeof values === 'object' ? values : {};
        const nextCounts = createEmptyMemberFunctionCounts();

        MEMBER_FUNCTIONS.forEach(({ value }) => {
          const count = rawCounts[value];
          nextCounts[value] = typeof count === 'number' && Number.isFinite(count) ? count : 0;
        });

        setCounts(nextCounts);
        setHasError(false);
      },
      (error) => {
        console.error('Error loading member function counts:', error);
        setHasError(true);
      }
    );

    return unsubscribe;
  }, []);

  return (
    <section className="member-counts" aria-labelledby="member-counts-title">
      <h2 id="member-counts-title">Amicalistes</h2>
      {hasError ? (
        <p className="member-counts-error" role="alert">
          Les compteurs sont indisponibles pour le moment.
        </p>
      ) : (
        <div className="member-count-grid">
          {MEMBER_FUNCTIONS.map((memberFunction) => {
            const Icon = memberFunction.value === 'sssm'
              ? Stethoscope
              : memberFunction.value === 'pats'
                ? Briefcase
                : Flame;

            return (
              <article className="member-count-card" key={memberFunction.value}>
                <Icon aria-hidden="true" />
                <h3>{memberFunction.acronym}</h3>
                <p className="member-count-number">
                  {counts ? counts[memberFunction.value] : '…'}
                </p>
                <p className="member-count-description">{memberFunction.description}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
