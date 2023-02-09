<script lang="ts">
 import { assignmentTable } from './optimize'
 import { idIfy, rankColor } from './util'

 export let shorts: string[]
 export let assignments: object
 export let show_rankings: boolean
 export let force_include: string[]
 export let pinned: object

 $: table = assignmentTable(assignments, shorts)

 function scroll(name) {
     // Scroll to the element for the given name in the Students table.
     document.getElementById(idIfy(name)).scrollIntoView()
 }
</script>

<div class="block is-flex is-justify-content-center">
  <table class="table">
    <thead>
      <tr>
        {#each shorts as short}
          <th>
            {short}
            {#if show_rankings && force_include[short]}
              <span class="icon is-small has-text-grey-dark">
                <i class="fas fa-thumbtack"></i>
              </span>
            {/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each table as row}
        <tr>
          {#each row as data}
            {#if data && show_rankings}
              <td style="background-color: {rankColor(data.rank)}" on:click={scroll(data.name)}>
                {data.name} ({data.rank}) {#if data.director} <span class="tag is-success">Dir.</span>{/if}
                {#if pinned[data.name]}
                  <span class="icon is-small has-text-grey-dark">
                    <i class="fas fa-thumbtack"></i>
                  </span>
                {/if}
              </td>
            {:else}
              <td on:click={scroll(data.name)}>
                {data ? (data.name.toLowerCase().includes('absent') ? '+1' : data.name) : ''}
                {#if data?.director} <span class="tag is-primary is-light">Dir.</span>{/if}
              </td>
            {/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
