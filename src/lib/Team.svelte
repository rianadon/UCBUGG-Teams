<script lang="ts">
 import { idIfy, longestCommonSubsequence, rankColor} from './util'
 import Optimizer from './Optimizer.svelte'

 export let results: any;

 let field_name = 'Name';
 let field_director = 'If so, what was the name of your pitch?';
 let absences = 0; // Number of absences
 let short_fields = {}; // Mapping of short -> CSV field for that short
 let pinned = {}; // Students who have been pinned to a short
 let assignments = {}; // From optimizer
 let short_sums = {}; // Sum of rankings for every short

 $: raw_data = results.data.filter(d => !!d[field_name]) // Valid data from CSV file
 $: shorts = raw_data.map(d => d[field_director]).filter(d => !!d) // The list of shorts
 $: result_data = addAbsent(raw_data, absences) // Data including absent students
 $: shorts && assignShorts()
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
 $: {
     for (const short of shorts) {
         short_sums[short] = result_data.reduce((tot, data) => tot + data[short_fields[short]], 0)
     }
 }
 $: sorted_shorts = [...shorts].sort((a, b) => short_sums[a] - short_sums[b])

 function addAbsent(data, absences) {
     let dat = [...data];
     for (let i = 0; i < absences; i++) {
         const student = { [field_name]: `Absent ${i+1}`, [field_director]: null };
         for (const short of shorts) student[short_fields[short]] = null;
         dat.push(student);
     }
     console.log(dat);
     return dat;
 }

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

 function footerStyle(short: string, assignments) {
     if (!assignments[result_data[0][field_name]] || chosenShorts.has(short)) return ''
     return 'text-decoration: line-through'
 }

 function togglePin(name: string, short: string) {
     if (pinned[name] == short) pinned[name] = undefined
     else pinned[name] = short
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

{#if shorts.length}<div class="label">Match Columns to Shorts</div>{/if}
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

<div class="field">
  <div class="label">Manually Add Absences</div>
  <div class="control">
    <input class="input" type="number" min="0" bind:value={absences} style="max-width: 26.4em">
  </div>
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
      <tr id={idIfy(data[field_name])}>
        <th>{data[field_name]}</th>
        <td>{data[field_director] || ''}</td>
        {#each shorts as short}
          <td style={tableStyle(data, short, assignments)}>
            {data[short_fields[short]]}
            <span class="icon is-small pinner {pinned[data[field_name]] == short ? 'pinned' : ''}"
                  on:click={togglePin(data[field_name], short)}>
              <i class="fas fa-thumbtack"></i>
            </span>
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr>
      <th></th>
      <th></th>
      {#each shorts as short}
        <th style={footerStyle(short, assignments)}>
          {short_sums[short]}
        </th>
      {/each}
    </tr>
  </tfoot>
</table>

<Optimizer data={optimizer_data} shorts={sorted_shorts} pinned={pinned} bind:assignments={assignments} />

<style>
 .fields {
     columns: 2;
 }

 .pinner {
     margin-left: 0.75em;
     opacity: 0;
     color: #000;
     transition: opacity 0.1s;
 }

 td:hover .pinner {
     opacity: 0.5;
     cursor: pointer;
 }

 td .pinner.pinned {
     opacity: 1;
 }

</style>
