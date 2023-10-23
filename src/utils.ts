export function safeParse <T> (string: string) {
    try {
        return JSON.parse(string) as T;
    } catch {
        return null;
    }
}

export function getCurrencyName (currency: string) {
    return new Intl.NumberFormat('fr', {
        style: 'currency',
        currency,
        currencyDisplay: 'name',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).formatToParts(0).find(({ type }) => type === 'currency')!.value;
}

export function getCurrencySymbol (currency: string) {
    return new Intl.NumberFormat('fr', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).formatToParts(0).find(({ type }) => type === 'currency')!.value;
}

export function formatDate (date: Date) {
    return new Intl.DateTimeFormat('fr', {
        weekday: 'short',
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}
