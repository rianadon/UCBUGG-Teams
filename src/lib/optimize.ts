import { HighsSolution } from 'highs'

export interface OptimizerData {
     name: string
     directing: string | null
     preferences: {
         [short: string]: number
     }
}

export interface OptimizerOptions {
    power: number
    minStudents: number
    maxStudents: number
    forceInclude: {
        [short: string]: boolean
    }
    caps: {
        [pref: number]: string // string since they come in from text fields
    }
}

export function optimizerProblem(data: OptimizerData[], shorts: string[], options: OptimizerOptions) {
    const shortsToDirectors = {}
    const constraints = []
    const variables = []
    let objective = '0'

    let tallies = {};

    // Iterate per student, ensuring that they are assigned to only 1 short
    // And minimize the total rankings of students
    for (let i = 0; i < data.length; i++) {
        const vars = Array.from(shorts.map((_, j) => `x${i}@${j}`))
        variables.push(...vars)
        constraints.push(vars.join('+') + ' = 1')
        for (let j = 0; j < shorts.length; j++) {
            const preference = data[i].preferences[shorts[j]]
            // Add the preference^pow to the objective function
            objective += ` + ${Math.pow(preference, options.power)} ${vars[j]}`
            // Tally up the number of students who got assigned this preference
            if (!tallies[preference]) tallies[preference] = [];
            tallies[preference].push(vars[j]);
        }
        if (data[i].directing) shortsToDirectors[data[i].directing] = i
    }

    // Iterate per short, making sure that short gets the correct range of students.
    for (let j = 0; j < shorts.length; j++) {
        const director = shortsToDirectors[shorts[j]]
        if (!director) throw new Error(`Short ${shorts[j]} does not have a director`)

        const vars = Array.from(data.map((_, i) => `x${i}@${j}`))
        const director_ass = `x${director}@${j}` // Whether the director is assigned to this short
        const vars_nodir = vars.filter(v => v != director_ass)

        // Highs gets upset if the director assigned variable appears in the equation twice.
        // Instead, it's omitted from the initial variables, and its coefficient is later modified to compensate
        constraints.push(
            `${vars_nodir.join('+')} - ${options.minStudents - 1} ${director_ass} >= 0`,
            `${vars_nodir.join('+')} - ${options.maxStudents - 1} ${director_ass} <= 0`
        )

        // Handle forced inclusion
        if (options.forceInclude[shorts[j]]) {
            constraints.push(director_ass + ' = 1')
        }
    }

    for (const [tally, cap] of Object.entries(options.caps || {})) {
        if (!isNaN(Number(cap)) && cap.length) constraints.push(tallies[tally].join('+') + '<=' + cap)
    }

    return `Minimize ${objective}
Subject To
${constraints.join('\n')}
Binary
${variables.join(' ')}
End`
}

type Assignments = {
    [name: string]: {
        short: string
        rank?: number
        director: boolean
    }
}

export function parseSolution(solution: HighsSolution, data: OptimizerData[], shorts: string[]) {
    const assignments: Assignments = {}
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < shorts.length; j++) {
            if ((solution.Columns[`x${i}@${j}`] as any).Primal == 1) {
                assignments[data[i].name] = {
                    short: shorts[j],
                    rank: data[i].preferences[shorts[j]],
                    director: data[i].directing == shorts[j]
                }
            }
        }
    }
    return assignments
}

export function assignmentTable(assignments: Assignments, shorts: string[]) {
    const table = shorts.map(short => Object.entries(assignments)
        .filter(([_, s]) => s.short == short)
        .map(([n, s]) => ({ name: n, ...s }))
        .sort((a, b) => b.director - a.director)
                            )
    const inverted = []
    for (let i = 0; i < Math.max(...table.map(c => c.length)); i++) {
        inverted[i] = table.map(t => t[i]);
    }
    return inverted
}

export function countRank(assignments: Assignments, rank: number) {
    let count = 0;
    for (const sign of Object.values(assignments)) {
        if (rank == sign.rank) count++;
    }
    return count;
}
