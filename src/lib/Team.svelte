<script lang="ts">
 import {longestCommonSubsequence, rankColor} from './util'
 import Optimizer from './Optimizer.svelte'

 export let results: any;

 let field_name = 'Name';
 let field_director = 'If so, what was the name of your pitch?';
 let short_fields = {}; // Mapping of short -> CSV field for that short
 let assignments = {}; // From optimizer

 $: shorts = results.data.map(d => d[field_director]).filter(d => !!d)
 $: shorts && assignShorts()
 $: result_data = results.data.filter(d => !!d[field_name])
 $: optimizer_data = result_data.map(d => {
     const prefs = {}
     for (const short of shorts) {
         prefs[short] = d[short_fields[short]]
     }
     return {
         name: d[field_name],
         directing: d[field_director],
         preferences: prefs
     }
 })
 $: chosenShorts = new Set(Object.values(assignments).map(a => a.short))

 function assignShorts() {
     for (const short of shorts) {
         const distances = results.meta.fields.map(f => longestCommonSubsequence(f.toLowerCase(), short.toLowerCase()))
         const minDistance = Math.max(...distances)
         short_fields[short] = results.meta.fields[distances.indexOf(minDistance)]
     }
 }

 function tableStyle(data: object, short: string, assignments) {
     const assignment = assignments[data[field_name]]
     if (assignment) {
         if (assignment.short == short) {
             const color = rankColor(assignments[data[field_name]].rank)
             return 'background-color: ' + color
         }
         if (!chosenShorts.has(short)) {
             return 'text-decoration: line-through; color: hsl(0, 0%, 71%)'
         }
     }
     return ''
 }
</script>

<div class="field">
  <div class="label">Name</div>
  <div class="control">
    <div class="select">
      <select bind:value={field_name}>
        {#each results.meta.fields as field}
          <option>{field}</option>
        {/each}
      </select>
    </div>
  </div>
</div>

<div class="field">
  <div class="label">Name of Director's Pitch</div>
  <div class="control">
    <div class="select">
      <select bind:value={field_director} on:change={assignShorts}>
        {#each results.meta.fields as field}
          <option>{field}</option>
        {/each}
      </select>
    </div>
  </div>
</div>

{#if shorts.length}<div class="label">Match columns to shorts</div>{/if}
<div class="block fields">
  {#each shorts as short}
    <div class="field is-horizontal">
      <div class="field-label is-small">{short}</div>
      <div class="field-body">
        <div class="field is-narrow">
          <div class="control">
            <div class="select is-small">
              <select bind:value={short_fields[short]}>
                {#each results.meta.fields as field}
                  <option>{field}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>

<table class="table is-striped is-size-7">
  <thead>
    <th>Name</th>
    <th>Directing Preference</th>
    {#each shorts as short}
      <th>{short}</th>
    {/each}
  </thead>
  <tbody>
    {#each result_data as data}
      <tr>
        <th>{data[field_name]}</th>
        <td>{data[field_director] || ''}</td>
        {#each shorts as short}
            <td style={tableStyle(data, short, assignments)}>{data[short_fields[short]]}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<Optimizer data={optimizer_data} shorts={shorts} bind:assignments={assignments} />

<style>
 .fields {
     columns: 2;
 }
</style>
