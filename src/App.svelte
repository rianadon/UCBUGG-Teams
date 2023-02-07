<script lang="ts">
 import Team from './lib/Team.svelte'
 import Papa from 'papaparse'

 let error: Error = null
 let results: any = null

 if (localStorage['results']) results = JSON.parse(localStorage['results'])

 function upload() {
     try {
         results = null
         Papa.parse(this.files[0], {
             header: true,
             dynamicTyping: true,
             error(err) { error = err; },
             complete(res) {
                 if (res.errors.length) {
                     error = Error('The CSV file could not be parsed.')
                 } else {
                     error = null
                     results = res
                     localStorage['results'] = JSON.stringify(results)
                 }
             },
         })
     } catch (err) {
         error = err
     }
 }
</script>

<section class="section">
  <div class="container">
    <h1 class="title">
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
<style>
 input[type="file"] {
     display: none;
 }
</style>
