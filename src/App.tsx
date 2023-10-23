import clsx from 'clsx';
import { eachDayOfInterval, eachMonthOfInterval, endOfMonth, endOfYear, isSameDay, setMonth, startOfMonth, startOfYear } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import data from './assets/data.json';
import { getCurrencyName } from './utils';

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
  const [current, setCurrent] = useState(() => startOfMonth(new Date()));
  const [rate, setRate] = useState(500);
  const [currency, setCurrency] = useState('EUR');
  const [withTaxes, setWithTaxes] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  const range = useMemo(() => eachMonthOfInterval({ start: startOfYear(new Date()), end: endOfYear(new Date()) }), []);

  const breakdown = activities.reduce((acc, activity) => {
    for (const scope of activity.scopes) {
      const previous = acc.findIndex(({ name }) => name === scope.name);

      if (previous !== -1) {
        acc[previous].time += scope.time;
        acc[previous].content.push(...scope.content);
        acc[previous].span += 1;
      } else {
        acc.push({ ...scope, span: 1 });
      }
    }

    return acc;
  }, [] as Array<Scope & { span: number }>).sort((a, b) => a.name.localeCompare(b.name));
  // console.log(breakdown);

  const total = activities.reduce((totals, activity) => totals + activity.scopes.reduce((total, { time }) => total + time, 0), 0);

  useEffect(() => {
    console.log(current);
    
    const newActivites = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) }).map((date) => ({ date, scopes: [] }) as Activity);
    console.log('before', JSON.parse(JSON.stringify(newActivites)));

    // Merge with saved data
    for (const { date, scopes } of data) {
      const index = newActivites.findIndex((activity) => isSameDay(activity.date, date));
      console.log({ date, scopes }, newActivites[index].date);

      if (index >= 0) {
        newActivites[index].scopes.push(...scopes.map((scope) => ({ ...scope })));
      }
    }
    console.log('after', newActivites);
    

    setActivities(newActivites);
  }, [current]);

  return (
    <main className="p-8 space-y-8 container mx-auto">
      <div className="flex items-center gap-8">
        <label>
          <div>Mois</div>
          <select value={current.getMonth()} onChange={(e) => setCurrent((previous) => setMonth(previous, Number(e.target.value)))}>
            {range.map((month) => <option key={month.getMonth()} value={month.getMonth()}>{month.toLocaleString('fr', { month: 'long' })}</option>)}
          </select>
        </label>
        <label>
          <div>TJM</div>
          <input className="appearance-none" type="number" value={rate} onChange={(e) => setRate(e.target.valueAsNumber)} />
          €
        </label>
        <label>
          <div>Devise</div>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {['EUR', 'USD', 'JPY'].map((currency) => <option value={currency}>{getCurrencyName(currency)}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={withTaxes} onChange={(e) => setWithTaxes(e.target.checked)} />
          <span>soumis à TVA</span>
        </label>
      </div>
      <table className="table table-auto w-full rounded-xl overflow-hidden shadow">
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
                  {m === 0 && <td className="p-1 text-center" rowSpan={activity.scopes.length}>{activity.date.toLocaleDateString()}</td>}
                  <td className="p-1">
                    <div className="flex items-center justify-between">
                      <div>{scope.name}</div>
                      <div className="font-bold">{scope.time}</div>
                    </div>
                  </td>
                  <td className="p-1">
                    <ul>
                      {scope.content.map((entry, n) => (
                        <li key={n}>・{entry}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))
            ) :  (
              <tr key={activity.date.toISOString()} className={clsx('divide-x', n % 2 === 0 ? 'bg-white' : 'bg-gray-100')}>
                <td className="p-1 text-center">{activity.date.toLocaleDateString()}</td>
                <td className="p-1 text-center" colSpan={2}>-</td>
              </tr>
            )
          ))}
        </tbody>
      </table>
      {/* todo table */}
      <table className="table table-auto w-full rounded-xl overflow-hidden shadow divide-y text-center">
        <thead className="divide-y">
          <tr>
            <th className="font-bold" colSpan={withTaxes ? 4 : 3}>Facturation</th>
          </tr>
          <tr className="divide-x">
            <th>Objet</th>
            <th>Quantité</th>
            <th>Prix {withTaxes ? 'HT' : 'unitaire'}</th>
            {withTaxes && <th>Prix TTC</th>}
          </tr>
        </thead>
        <tbody>
          {breakdown.map(({ name, time, content, span }) => (
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
