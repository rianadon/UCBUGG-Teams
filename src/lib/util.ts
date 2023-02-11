export function rankColor(rank: number) {
    if (rank == null) return 'hsl(0, 0%, 92%)'
    if (rank == 1) return 'hsl(142, 52%, 86%)'
    if (rank == 2) return 'hsl(48, 100%, 86%)'
    if (rank == 3) return 'hsl(20, 95%, 86%)'
    if (rank == 4) return 'hsl(347, 90%, 86%)'
    if (rank == 5) return 'hsl(304, 95%, 86%)'
    return 'hsl(240, 100%, 86%)'
}

// Thanks stackoverflow
export function longestCommonSubsequence(a, b) {
    const matrix = Array(a.length + 1).fill().map(() => Array(b.length + 1).fill(0));
    let maximum = 0;
    for(let i = 1; i < a.length + 1; i++) {
        for(let j = 1; j < b.length + 1; j++) {
            if(a[i-1] === b[j-1]) {
                matrix[i][j] = 1 + matrix[i-1][j-1];
                maximum = Math.max(maximum, matrix[i][j]);
            } else {
                matrix[i][j] = 0;
            }
        }
    }
    return maximum;
}

export function idIfy(name: string) {
    return name.replace(/[^a-zA-z0-9]+/g, '-');
}

export function duplicates(list: string[]) {
    return list.filter((e, i) => list.indexOf(e) !== i)
}
