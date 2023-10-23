export function getCurrencyName (currency: string) {
    return new Intl.NumberFormat('fr', {
        style: 'currency',
        currency,
        currencyDisplay: 'name',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).formatToParts(0).find(({ type }) => type === 'currency')!.value;
}
