// CI partitions select existing cases; an unfiltered local run keeps the full suite.
export function selectCases(allowed, value, label) {
 if (value === undefined || value === 'all') return [...allowed];
 if (!allowed.includes(value)) throw new Error('INVALID_' + label);
 return [value];
}
