import type { HighsSolution, Highs } from 'highs'

const MAX_SOLUTIONS = 50

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
    absencesMax: number
    maxGroups: number
    forceInclude: {
        [short: string]: boolean
    }
    pinned: {
        [name: string]: string
    }
    caps: {
        [pref: number]: string // string since they come in from text fields
    }
    ignoredSolutions?: HighsSolution[] // Solutions to exclude, useful if outputting multiple solutions
    ignoredShortLists?: string[][]
}

export function optimizerProblem(data: OptimizerData[], shorts: string[], options: OptimizerOptions) {
    const shortsToDirectors = {}
    const constraints = []
    const variables = []
    let objective = '0'

    let tallies = {};
    let absents: number[] = []; // List of students who were absent

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
        if (options.pinned[data[i].name]) {
            constraints.push(`x${i}@${shorts.indexOf(options.pinned[data[i].name])} = 1`)
        }
        if (data[i].name.toLowerCase().includes('absent')) absents.push(i)
    }
    console.log(shortsToDirectors)

    const chosen = []
    // Iterate per short, making sure that short gets the correct range of students.
    for (let j = 0; j < shorts.length; j++) {
        const director = shortsToDirectors[shorts[j]]
        if (!(shorts[j] in shortsToDirectors)) throw new Error(`Short "${shorts[j]}" does not have a director`)

        const vars = Array.from(data.map((_, i) => `x${i}@${j}`))
        const director_ass = `x${director}@${j}` // Whether the director is assigned to this short
        chosen.push(director_ass)
        const vars_nodir = vars.filter(v => v != director_ass)

        // Highs gets upset if the director assigned variable appears in the equation twice.
        // Instead, it's omitted from the initial variables, and its coefficient is later modified to compensate
        constraints.push(
            `${vars_nodir.join('+')} - ${options.minStudents - 1} ${director_ass} >= 0`,
            `${vars_nodir.join('+')} - ${options.maxStudents - 1} ${director_ass} <= 0`,
            '0 +' + absents.map(a => `x${a}@${j}`).join('+') + '<= ' + options.absencesMax // Limit absent students
        )

        // Handle forced inclusion
        if (options.forceInclude[shorts[j]]) {
            constraints.push(director_ass + ' = 1')
        }
    }
    constraints.push(chosen.join('+') + '<=' + options.maxGroups)

    // Handling ignored sets of shorts works very similar to ignoring solutions below.
    if (options.ignoredShortLists) {
        for (const shortList of options.ignoredShortLists) {
            const sum = shortList.map(s => chosen[shorts.indexOf(s)]).join('+')
            console.log(sum)
            constraints.push(sum + '<=' + (shortList.length-1));
        }
    }

    // To handle ignored solutions, add the constraint that the dot product between the variables
    // and ignored solutions must be less than the number of variables.
    // i.e. the returned solution must have at one variable reassigned.
    if (options.ignoredSolutions) {
        for (const solution of options.ignoredSolutions) {
            let constraint = []
            for (const [variable, value] of Object.entries(solution.Columns)) {
                if (value.Primal == 1) constraint.push(variable)
            }
            constraints.push(constraint.join('+') + '<=' + (constraint.length-1))
        }
    }

    // Handle caps on the number of students given some rank of short
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

/** Convert the solution given by HIGHS to an assignment of student -> short */
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

/** Return a generator that yields solutions for an optimization problem. */
export function* optimize(highs: Highs, data: OptimizerData[], shorts: string[], options: OptimizerOptions) {
    let ignoredSolutions = [...(options.ignoredSolutions || [])]
    let scoreBound = Infinity
    for (let i = 0; i < MAX_SOLUTIONS; i++) {
        const problem = optimizerProblem(data, shorts, {...options, ignoredSolutions})
        const solution = highs.solve(problem)
        // Two break conditions: no solution found or the solution has a lower objective value
        if (solution.Status !== 'Optimal') break
        if (solution.ObjectiveValue > scoreBound) break
        ignoredSolutions.push(solution)
        scoreBound = solution.ObjectiveValue
        yield parseSolution(solution, data, shorts)
    }
}

/** Return a generator that yields solutions with different short assignments. */
export function* alternateShortOptions(highs: Highs, data: OptimizerData[], shorts: string[], options: OptimizerOptions) {
    let ignoredShortLists = [...(options.ignoredShortLists || [])]
    for (let i = 0; i < 10; i++) {
        const problem = optimizerProblem(data, shorts, {...options, ignoredShortLists})
        const solution = highs.solve(problem)
        if (solution.Status !== 'Optimal') break
        const parsed = parseSolution(solution, data, shorts)
        ignoredShortLists.push([...new Set(Object.values(parsed).map(s => s.short))])
        if (i > 0) yield parsed
    }
}

/** Convert solution to a format that can be displayed in a table on the webpage */
export function assignmentTable(assignments: Assignments, shorts: string[]) {
    const table = shorts.map(short => Object.entries(assignments)
        .filter(([_, s]) => s.short == short)
        .map(([n, s]) => ({ name: n, ...s }))
        .sort((a, b) => Number(b.director) - Number(a.director))
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
