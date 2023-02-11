<script lang="ts">
 import AssignmentTable from './AssignmentTable.svelte'
import { alternateShortOptions, countRank, optimize } from './optimize'
 import highs_loader, { Highs } from 'highs'
 import highsUrl from 'highs/build/highs.wasm?url'

 export let data
 export let shorts: string[]
 export let pinned: object

 let error: Error = null
 let solutions: Generator<Assignments>
 export let assignments = {}

 let highs: Highs
 highs_loader({
     locateFile: () => highsUrl
 }).then(h => highs = h)

 let show_rankings = true
 let power = '1'
 let min_students = 4
 let max_students = 6
 let max_groups = 6
 let absences_max = 2
 let caps = { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '' };
 let force_include = {}
 let allAssignTables = []

 $: {
     if (highs) try {
         solutions = optimize(highs, data, shorts, {
             power, pinned, caps,
             minStudents: min_students,
             maxStudents: max_students,
             maxGroups: max_groups,
             forceInclude: force_include,
             absencesMax: absences_max,
         })
         const {done, value} = solutions.next()
         assignments = done ? {} : value
         allAssignTables = []
         error = null
     } catch (e) {
         error = e
     }
 }
 $: chosenShorts = [...new Set(Object.values(assignments).map(s => s.short))].sort()

 function calculateAllSolutions() {
     // Calculate a maximum of 50 alternate solutions with the same objective value
     allAssignTables = []
     for (const secondAssignments of solutions) {
         const secondShorts = [...new Set(Object.values(secondAssignments).map(s => s.short))].sort()
         allAssignTables.push({ shorts: secondShorts, assignments: secondAssignments })
     }
     if (allAssignTables.length == 0) {
         allAssignTables = false // Signal that no alternate solutions were found
     }
 }

 function calculateOtherSolutions() {
     // Calculate a maximum of 50 alternate solutions with the same objective value
     allAssignTables = []
     const options = alternateShortOptions(highs, data, shorts, {
         power, pinned, caps,
         minStudents: min_students,
         maxStudents: max_students,
         maxGroups: max_groups,
         forceInclude: force_include,
         absencesMax: absences_max,
     })
     for (const secondAssignments of options) {
         const secondShorts = [...new Set(Object.values(secondAssignments).map(s => s.short))].sort()
         allAssignTables.push({ shorts: secondShorts, assignments: secondAssignments })
     }
     if (allAssignTables.length == 0) {
         allAssignTables = false // Signal that no alternate solutions were found
     }
 }
</script>

<div class="box">

  {#if error}
    <div class="notification is-danger">
      {error}
    </div>
  {:else if !highs}
    <div class="notification">
      Loading Optimization Engine
    </div>
  {:else}

  <div class="field is-horizontal">
    <div class="field field-sm">
      <p class="control">
        <input class="input" type="number" bind:value={min_students}>
      </p>
    </div>
    <div class="field-label is-normal field-squish">
      <label class="label">&leq; Students/Gr &leq;</label>
    </div>
    <div class="field field-sm">
      <p class="control">
        <input class="input" type="number" bind:value={max_students}>
      </p>
    </div>

    <div class="field-label is-normal field-label-xs">
      <label class="label">Absent/Gr &leq;</label>
    </div>
    <div class="field field-sm">
      <p class="control">
        <input class="input" type="number" bind:value={absences_max}>
      </p>
    </div>

    <div class="field-label is-normal field-label-xs">
      <label class="label">Gr &leq;</label>
    </div>
    <div class="field field-sm">
      <p class="control">
        <input class="input" type="number" bind:value={max_groups}>
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

  {#if Object.keys(assignments).length}
    <AssignmentTable shorts={chosenShorts} assignments={assignments}
                     show_rankings={show_rankings} force_include={force_include} pinned={pinned} />
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
    <label class="label">Force Include (Sorted by Popularity)</label>
  </div>

  <div class="shortlist block">
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

  <div class="field is-flex is-justify-content-center is-grouped">
    <p class="control">
      <button class="button is-primary" on:click={calculateAllSolutions}>
        <span class="icon is-small">
          <i class="fas fa-calculator"></i>
        </span>
        <span>Show All Solutions</span>
      </button>
    </p>
    <p class="control">
      <button class="button" on:click={calculateOtherSolutions}>
        <span class="icon is-small">
          <i class="fas fa-calculator"></i>
        </span>
        <span>Show Solutions with Alternative Shorts</span>
      </button>
    </p>
  </div>

  {#if allAssignTables === false}
    <div class="notification is-warning">
      Lucky you! There is only one solution!
    </div>
  {:else}
    {#each allAssignTables as {shorts, assignments}}
      <AssignmentTable shorts={shorts} assignments={assignments}
                       show_rankings={show_rankings} force_include={force_include} pinned={pinned} />
    {/each}
  {/if}

  {/if}
</div>

<style>
 .field-sm { width: 4em; }
 .field-xs { width: 3em; }
 .field-label-xs { margin-right: 0.5em; white-space: nowrap; }
 .field-check { line-height: 2.2em; }

 .field-squish {
     flex-grow: 0;
     white-space: nowrap;
     margin: 0 0.5em;
 }

 .shortlist { columns: 4 }
 @media screen and (max-width: 950px) {
     .shortlist { columns: 3 }
 }
 @media screen and (max-width: 700px) {
     .shortlist { columns: 2 }
 }
</style>
