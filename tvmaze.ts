import jQuery from 'jquery';

const $ = jQuery;

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $searchForm = $("#searchForm");

const BASE_API_URL = "http://api.tvmaze.com";
const DEFAULT_IMG_URL = "https://store-images.s-microsoft.com/image/apps.65316.13510798887490672.6e1ebb25-96c8-4504-b714-1f7cbca3c5ad.f9514a23-1eb8-4916-a18e-99b1a9817d15?mode=scale&q=90&h=300&w=300";

interface ShowInterface {
  id: number;
  name: string;
  summary: string;
  image: { original: string, medium: string; } | null;
}

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

async function searchShowsByTerm(term: string): Promise<ShowInterface[]> {
  const params = new URLSearchParams({ q: term });
  const response = await fetch(`${BASE_API_URL}/search/shows?${params}`);
  const completeShowData = await response.json() as { show: ShowInterface; }[];

  const showData = completeShowData.map(show => ({
    id: show.show.id,
    name: show.show.name,
    summary: show.show.summary,
    image: show.show.image

  }));
  return showData;
}


/** Given list of shows, create markup for each and to DOM */

function populateShows(shows: ShowInterface[]): void {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src="${show.image?.medium || DEFAULT_IMG_URL}"
              alt="A picture of ${show.name}"
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);

    $showsList.append($show);
  }
}


/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay() {
  const term = $("#searchForm-term").val();

  let shows;
  if (typeof term === 'string') {
    shows = await searchShowsByTerm(term);
    $episodesArea.hide();
    populateShows(shows);
  }
}

$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});


/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

interface EpisodeInterface {
  id: number;
  name: string;
  season: number;
  number: number;
}

/** Given show id, fetch epsidoes list for that show from API */

async function getEpisodesOfShow(id: number): Promise<EpisodeInterface[]> {
  const response = await fetch(`${BASE_API_URL}/shows/${id}/episodes`);
  const completeEpisodeData = await response.json() as EpisodeInterface[];

  const episodes = completeEpisodeData.map(episode => ({
    id: episode.id,
    name: episode.name,
    season: episode.season,
    number: episode.number,
  }));

  return episodes;
}

/** Given a list of episodes, clear episodes list and add new episodes to the DOM */

function populateEpisodes(episodes: EpisodeInterface[]): void {
  $episodesArea.empty();

  for (let episode of episodes) {
    const $episode = $(
      `<li>${episode.name} (Season ${episode.season}, Number ${episode.number})</li>`);

    $episodesArea.append($episode);
  }
  $episodesArea.show();
}

/** Event handler for Episodes button
 *
 *  Get list of episodes to display
 */
async function handleClick(evt: any) {
  const $button = evt.target;
  const showId = $button.closest(".Show").dataset.showId;

  const episodes = await getEpisodesOfShow(showId);

  populateEpisodes(episodes);
}

$showsList.on('click', 'button', handleClick);