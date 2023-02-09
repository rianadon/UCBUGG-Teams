<script lang="ts">
 import Team from './lib/Team.svelte'
 import Papa from 'papaparse'

 let error: Error = null
 let results: any = null

 if (localStorage['results']) results = JSON.parse(localStorage['results'])

 function upload() {
     results = null
     Papa.parse(this.files[0], {
         header: true,
         dynamicTyping: true,
         error(err) { error = err; },
         complete(res) {
             if (res.errors.length) {
                 error = Error('The CSV file could not be parsed.')
                 delete localStorage['results']
             } else {
                 error = null
                 results = res
                 localStorage['results'] = JSON.stringify(results)
             }
         },
     })
 }
</script>

<section class="section">
  <div class="container">
    <h1 class="title is-2">
      UCBUGG Team Formation
    </h1>
    <p class="subtitle">
      Assign teams based on student preferences.
    </p>

    {#if error}
      <div class="notification is-danger">
        {error}
      </div>
    {/if}

    <div class="file is-primary block">
      <label class="file-label">
        <input class="file-input" type="file" name="resume" on:change={upload}>
        <span class="file-cta">
          <span class="file-icon">
            <i class="fas fa-upload"></i>
          </span>
          <span class="file-label">
            Upload csv…
          </span>
        </span>
      </label>
    </div>
    <p class="block">
      From the Google Spreadsheet, click "File->Download->CSV".
    </p>

    {#if results}
      <Team results={results} />
    {/if}

  </div>
</section>

<section class="section">
  <h1 class="title is-4">Technical Details</h1>
  <div class="content">
    <p>The website treats team formation is treated as an <a href="https://en.wikipedia.org/wiki/Optimization_problem">optimization problem</a>. The optimization objective is to minimize the sum of all "unhappiness" of students. This is defined in various ways depending on the selected mode:</p>
    <ul>
      <li><i>Prioritize #1 Choices</i>: Unhappiness = sqrt(rank of assigned short)</li>
      <li><i>Weight Options the Same</i>: Unhappiness = rank</li>
      <li><i>Minimize High Rankings</i>: Unhappiness = rank²</li>
    </ul>
    <p>The optimization problem also has several constraints:</p>
    <ul>
      <li>A student can be assigned to only one short</li>
      <li>Directors must direct their short</li>
      <li>There is a bound for the number of students in a group</li>
      <li>The number of students who have their n<sup>th</sup> choice might be limited</li>
      <li>Some shorts might be forced to be included (and the directors would be assigned to these shorts)</li>
      <li>The number of absent students (their name includes "absent") is below some threshold</li>
    </ul>
    <p>There is a variable <i>x<sub>ij</sub></i> for every combination of student <i>i</i> who could be assigned to short <i>j</i> (<i>x<sub>ij</sub></i> = 1) or not assigned to the short (<i>x<sub>ij</sub></i> = 0). Since there are only 2 integer possibilities for every variable, the problem is an <a href="https://en.wikipedia.org/wiki/Integer_programming">integer program</a> which can be solved fairly quickly. This website uses a <a href="https://www.npmjs.com/package/highs">WebAssembly port</a> of the <a href="https://highs.dev">HiGHS</a> solver to solve the optimization problem.</p>
    <p>Multiple solutions are found by running the optimization solver multiple times, each time adding a new constraint that students cannot be assigned to shorts according to the previous solution. When the next solution is objectively worse or if more than 50 solutions are generated, the program stops. Running the optimization solver many times is why the "Show All Solutions" button can be a bit slow.</p>
    <p>The website was written by Ryan Adolf with the help of the <a href="https://svelte.dev/">Svelte</a> web framework, <a href="https://bulma.io/">Bulma</a> CSS framework, and <a href="https://www.papaparse.com/">Papa Parse</a> for parsing CSV files. The source code is available <a href="https://github.com/rianadon/UCBUGG-Teams">here</a>. </p>
  </div>
</section>
