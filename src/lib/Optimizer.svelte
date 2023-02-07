<script lang="ts">
 import { assignmentTable, optimizerProblem, parseSolution, countRank } from './optimize'
 import { rankColor } from './util'
 import highs_loader, { HighsSolution } from 'highs'
 import highsUrl from 'highs/build/highs.wasm?url'

 export let data
 export let shorts: string[]

 let show_rankings = true
 let solution: HighsSolution
 let shortsToStudents = {}
 export let assignments = {}

 const highs = highs_loader({
     locateFile: () => highsUrl
 })

 let power = '1'
 let min_students = 4
 let max_students = 6
 let absences = 0
 let absences_max = 2
 let caps = {
     1: '',
     2: '',
     3: '',
     4: '',
     5: '',
     6: '',
     7: '',
     8: ''
 }
 let force_include = {}

 $: optimizerScript = optimizerProblem(data, shorts, {
     power,
     minStudents: min_students,
     maxStudents: max_students,
     forceInclude: force_include,
     caps
 })
 $: highs.then(h => { solution = h.solve(optimizerScript) })
 $: solution && (assignments = parseSolution(solution, data, shorts, absences))
 $: chosenShorts = [...new Set(Object.values(assignments).map(s => s.short))]
 $: assignTable = assignmentTable(assignments, chosenShorts)
</script>

<div class="box">

  <div class="field is-horizontal">
    <div class="field field-sm">
      <p class="control">
        <input class="input" type="number" bind:value={min_students}>
      </p>
    </div>
    <div class="field-label is-normal field-squish">
      <label class="label">&leq; Students Per Group &leq;</label>
    </div>
    <div class="field field-sm">
      <p class="control">
        <input class="input" type="number" bind:value={max_students}>
      </p>
    </div>
    <div class="field-label is-normal">
      <label class="label">Mode</label>
    </div>
    <div class="field">
      <div class="control">
        <div class="select">
          <select bind:value={power}>
            <option value="0.5">Prioritize #1 Choices</option>
            <option value="1">Weight Options the Same</option>
            <option value="2">Minimize High Rankings</option>
          </select>
        </div>
      </div>
    </div>

    <div class="field-label is-normal">
      <label class="label">Rankings</label>
    </div>
    <div class="field field-check">
      <p class="control">
        <label class="checkbox">
          <input type="checkbox" bind:checked={show_rankings}>
          Show
        </label>
      </p>
    </div>
  </div>

  {#if solution?.Status == 'Optimal'}
    <div class="block is-flex is-justify-content-center">
    <table class="table">
      <thead>
        <tr>
          {#each chosenShorts as short}
            <th>
              {short}
              {#if force_include[short]}
                <span class="icon is-small has-text-grey-dark">
                  <i class="fas fa-thumbtack"></i>
                </span>
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each assignTable as row}
          <tr>
            {#each row as data}
              {#if data && show_rankings}
                <td style="background-color: {rankColor(data.rank)}">
                  {data.name} ({data.rank}) {#if data.director} <span class="tag is-success">Dir.</span>{/if}
                </td>
              {:else}
                <td>{data?.name || ''} {#if data?.director} <span class="tag is-primary is-light">Dir.</span>{/if}</td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    </div>
  {:else}
    <div class="notification is-danger">
      The optimizer could not find a solution given the constraints.
    </div>
  {/if}


  <div class="field is-horizontal">
    {#each Object.keys(caps) as cap}
      <div class="field-label is-normal field-label-xs">
        <label class="label">{cap}s &leq;</label>
      </div>
      <div class="field field-xs">
        <p class="control">
          <input class="input" type="text" bind:value={caps[cap]} placeholder={countRank(assignments, cap)}>
        </p>
      </div>
    {/each}
  </div>

  <div class="label is-normal">
    <label class="label">Force Include</label>
  </div>

  <div class="shortlist">
    {#each shorts as short}
      <div class="field">
        <div class="control">
          <label class="checkbox">
            <input type="checkbox" bind:checked={force_include[short]}>
            {short}
          </label>
        </div>
      </div>
    {/each}
  </div>

</div>

<style>
 .field-sm { width: 4em; }
 .field-xs { width: 3em; }
 .field-label-xs { margin-right: 0.5em; }
 .field-check { line-height: 2.2em; }

 .field-squish {
     flex-grow: 0;
     white-space: nowrap;
     margin: 0 1em;
 }

 .shortlist { columns: 4 }
 @media screen and (max-width: 950px) {
     .shortlist { columns: 3 }
 }
</style>
