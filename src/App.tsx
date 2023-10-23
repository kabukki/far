import clsx from 'clsx';
import { eachDayOfInterval, eachMonthOfInterval, endOfMonth, endOfYear, isSameDay, setMonth, startOfMonth, startOfYear } from 'date-fns';
import { ChangeEvent, useMemo, useState } from 'react';

import { formatDate, getCurrencyName, getCurrencySymbol } from './utils';
import { usePersistentState } from './hooks';

type Scope = {
  name: string
  time: number
  content: string[]
}

type Activity = {
  date: Date
  scopes: Scope[]
}

export function App () {
  const [data, setData] = usePersistentState('data', [] as Activity[]);
  const [rate, setRate] = usePersistentState('rate', 500);
  const [currency, setCurrency] = usePersistentState('currency', 'EUR');
  const [withTaxes, setWithTaxes] = usePersistentState('taxes', false);
  const [current, setCurrent] = useState(() => startOfMonth(new Date()));

  const range = useMemo(() => eachMonthOfInterval({ start: startOfYear(new Date()), end: endOfYear(new Date()) }), []);
  const activities = useMemo(() => {
    const newActivites = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) }).map((date) => ({ date, scopes: [] }) as Activity);

    // Merge with saved data
    for (const { date, scopes } of data) {
      const index = newActivites.findIndex((activity) => isSameDay(activity.date, new Date(date)));

      if (index >= 0) {
        newActivites[index].scopes.push(...scopes);
      }
    }
    
    return newActivites;
  }, [current, data]);

  const breakdown = activities.reduce((acc, activity) => {
    for (const scope of activity.scopes) {
      const previous = acc.findIndex(({ name }) => name === scope.name);

      if (previous !== -1) {
        acc[previous].time += scope.time;
        acc[previous].content.push(...scope.content);
      } else {
        acc.push({
          name: scope.name,
          content: scope.content.slice(),
          time: scope.time,
        });
      }
    }

    return acc;
  }, [] as Scope[]).sort((a, b) => a.name.localeCompare(b.name));

  const total = activities.reduce((totals, activity) => totals + activity.scopes.reduce((total, { time }) => total + time, 0), 0);

  const onCreateActivity = (filter: {
    day: Date
    scope?: Scope['name']
  }) => () => {
    setData((previous) => {
      const copy = previous.slice();
      let activity = copy.find(({ date }) => isSameDay(new Date(date), filter.day));
      
      if (!activity) {
        activity = { date: filter.day, scopes: [] };
        copy.push(activity);
      };
      
      let scope = activity.scopes.find(({ name }) => name === filter.scope);

      if (!scope) {
        scope = {
          name: 'x',
          time: 1,
          content: [],
        };
        activity.scopes.push(scope);
      }

      scope.content.push('');

      return copy;
    });
  };

  const onDeleteActivity = (filter: {
    day: Date
    scope: Scope['name']
    content: number
  }) => () => {
    setData((previous) => {
      const copy = previous.slice();
      const activity = copy.find(({ date }) => isSameDay(new Date(date), filter.day));
      
      if (activity) {
        const index = activity.scopes.findIndex(({ name }) => name === filter.scope);
  
        if (index >= 0) {
          activity.scopes[index].content.splice(filter.content, 1);

          // Delete scope if it becomes empty
          if (activity.scopes[index].content.length === 0) {
            activity.scopes.splice(index, 1);
          }
        }
      };

      return copy;
    });
  };


  const onUpdateScopeTime = (filter: {
    day: Date
    scope: Scope['name']
  }) => (e: ChangeEvent<HTMLInputElement>) => {
    setData((previous) => {
      const copy = previous.slice();
      const activity = copy.find(({ date }) => isSameDay(new Date(date), filter.day));
      
      if (activity) {
        const scope = activity.scopes.find(({ name }) => name === filter.scope);

        if (scope) {
          scope.time = isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : 0;
        }
      }

      return copy;
    });
  };

  const onUpdateScopeName = (filter: {
    day: Date
    scope: Scope['name']
  }) => (e: ChangeEvent<HTMLSpanElement>) => {
    setData((previous) => {
      const copy = previous.slice();
      const activity = copy.find(({ date }) => isSameDay(new Date(date), filter.day));
      
      if (activity) {
        const scope = activity.scopes.find(({ name }) => name === filter.scope);

        if (scope) {
          scope.name = e.target.textContent ?? '';
        }
      }

      return copy;
    });
  };


  const onUpdateScopeContent = (filter: {
    day: Date
    scope: Scope['name']
    content: number
  }) => (e: ChangeEvent<HTMLSpanElement>) => {
    setData((previous) => {
      const copy = previous.slice();
      const activity = copy.find(({ date }) => isSameDay(new Date(date), filter.day));
      
      if (activity) {
        const scope = activity.scopes.find(({ name }) => name === filter.scope);

        if (scope) {
          scope.content[filter.content] = e.target.textContent ?? '';
        }
      }

      return copy;
    });
  };

  return (
    <main className="p-8 space-y-8 container mx-auto">
      <div className="flex items-center gap-8">
        <label>
          <div>Mois</div>
          <select value={current.getMonth()} onChange={(e) => setCurrent((previous) => setMonth(previous, Number(e.target.value)))}>
            {range.map((month, n) => (
              <option key={month.getMonth()} value={month.getMonth()}>
                {month.toLocaleString('fr', { month: 'long' })}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div>TJM</div>
          <input className="appearance-none" type="number" value={rate} onChange={(e) => setRate(e.target.valueAsNumber)} />
          {getCurrencySymbol(currency)}
        </label>
        <label>
          <div>Devise</div>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {['EUR', 'USD', 'JPY'].map((currency) => (
              <option key={currency} value={currency}>{getCurrencyName(currency)}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={withTaxes} onChange={(e) => setWithTaxes(e.target.checked)} />
          <span>soumis à TVA</span>
        </label>
      </div>
      <table className="table table-auto w-full rounded-xl shadow">
        <thead className="text-white">
          <tr className="bg-lime-800 rounded-t-xl">
            <th colSpan={3} className="rounded-t-xl">
              Lucien LE ROUX - Compte-rendu d'activité - {current.toLocaleString('fr', { month: 'long', year: 'numeric' })}
            </th>
          </tr>
          <tr className="bg-lime-600">
            <th>Date</th>
            <th>Répartition</th>
            <th>Activités</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {activities.map((activity, n) => (
            activity.scopes.length > 0 ? (
              activity.scopes.map((scope, m) => (
                <tr key={`${activity.date.toISOString()}-${m}`} className={clsx('divide-x', n % 2 === 0 ? 'bg-white' : 'bg-gray-100')}>
                  {m === 0 && <td className="p-1 text-center" rowSpan={activity.scopes.length}>{formatDate(activity.date)}</td>}
                  <td className="p-1">
                    <div className="flex items-center justify-between">
                      <span
                        className="outline-none"
                        contentEditable
                        suppressContentEditableWarning
                        onInput={onUpdateScopeName({ day: activity.date, scope: scope.name })}
                      >{scope.name}</span>
                      <input
                        className="block appearance-none bg-inherit font-bold text-right w-24"
                        type="number"
                        value={scope.time}
                        min={0}
                        step={0.25}
                        onChange={onUpdateScopeTime({ day: activity.date, scope: scope.name })}
                      />
                    </div>
                  </td>
                  <td className="relative p-1 group">
                    <ul>
                      {scope.content.map((entry, n) => (
                        <li key={n} className="group/li">
                          ・
                          <span
                            className="outline-none"
                            contentEditable
                            suppressContentEditableWarning
                            onInput={onUpdateScopeContent({ day: activity.date, scope: scope.name, content: n })}
                          >{entry}</span>
                          <button
                            className="ml-2 text-red-800 opacity-0 transition group-hover/li:opacity-100"
                            onClick={onDeleteActivity({ day: activity.date, scope: scope.name, content: n })}
                          >&times;</button>
                        </li>
                      ))}
                    </ul>
                    <button
                      className="z-10 absolute inset-y-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-lime-600 text-white text-2xl shadow cursor-pointer opacity-0 transition group-hover:opacity-100"
                      onClick={onCreateActivity({ day: activity.date, scope: scope.name })}
                    >﹢</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr key={activity.date.toISOString()} className={clsx('divide-x', n % 2 === 0 ? 'bg-white' : 'bg-gray-100')}>
                <td className="p-1 text-center">{formatDate(activity.date)}</td>
                <td className="relative p-1 group" colSpan={2}>
                  <div className="text-center">-</div>
                  <button
                    className="z-10 absolute inset-y-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-lime-600 text-white text-2xl shadow cursor-pointer opacity-0 transition group-hover:opacity-100"
                    onClick={onCreateActivity({ day: activity.date })}
                  >﹢</button>
                </td>
              </tr>
            )
          ))}
        </tbody>
      </table>
      {/* todo table */}
      <table className="table table-auto w-full rounded-xl overflow-hidden shadow divide-y text-center">
        <thead className="text-white">
          <tr className="bg-lime-800">
            <th className="font-bold" colSpan={withTaxes ? 4 : 3}>Facturation</th>
          </tr>
          <tr className="bg-lime-600">
            <th>Objet</th>
            <th>Quantité</th>
            <th>Prix {withTaxes ? 'HT' : 'unitaire'}</th>
            {withTaxes && <th>Prix TTC</th>}
          </tr>
        </thead>
        <tbody>
          {breakdown.map(({ name, time, content }) => (
            <tr key={name} className="divide-x even:bg-white odd:bg-gray-100">
              <td className="font-bold">{name}</td>
              <td className="text-center">{time}</td>
              <td className="text-center">{(time * rate).toLocaleString('fr', { style: 'currency', currency })}</td>
              {withTaxes && <td className="text-center">{(time * rate * 1.2).toLocaleString('fr', { style: 'currency', currency })}</td>}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="divide-x">
            <td>Total</td>
            <td>{total} jours</td>
            <td>{(total * rate).toLocaleString('fr', { style: 'currency', currency })}</td>
            {withTaxes && <td className="font-bold">{(total * rate * 1.2).toLocaleString('fr', { style: 'currency', currency })}</td>}
          </tr>
        </tfoot>
      </table>
      <div className="p-1 shadow rounded-xl bg-white">
        <p>Facturé : {(total * rate).toLocaleString('fr', { style: 'currency', currency })}</p>
        <p>Net : ~{(total * rate * 0.78).toLocaleString('fr', { style: 'currency', currency })}</p>
      </div>
    </main>
  )
}
