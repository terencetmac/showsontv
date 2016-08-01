var DatePicker = (function () {
	var todayDate = new Date();

	function today() {
		return todayDate;
	}

	function tomorrow(date) {
		if (date) {
			var dateString = new Date(date);
			return new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate() +1);
		}
		var date = todayDate.getDate();
		return new Date(today.getFullYear(), today.getMonth(), date+1);
	}

	function yesterday(date) {
		if (date) {
			var dateString = new Date(date);
			return new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate() -1);
		}
		var date = todayDate.getDate();
		return new Date(today.getFullYear(), today.getMonth(), date-1);
	}

	return {
		today: today,
		tomorrow: tomorrow,
		yesterday: yesterday
	}
})();

var Util = (function () {

	function compareByDates (a, b) {
		var dateA = new Date(a.airstamp);
		var dateB = new Date(b.airstamp);
		if (dateA > dateB) {
			return -1;
		} 

		if (dateA < dateB) {
			return 1;
		} 

		return 0;
	}

	return {
		compareByDates: compareByDates
	}
})();

var FollowShows = (function () {
	var following = [];

	// events
	function attachEventListeners () {
		document.getElementById('following-shows').addEventListener('click', clickCallback, false);
	}

	function clickCallback () {
		if ( event.target !== event.currentTarget && event.target.classList.contains('showEpisodes-js') ) {
			var showId = event.target.parentElement.dataset.showId;
			showList(showId);
		}
	}

	function showList(showId) {
		var list = document.querySelector('[data-show-id="' + showId + '"] ul');
		var showListBtn = document.querySelector('[data-show-id="' + showId + '"] .showEpisodes-js');
		// if there are no .hidden elements in list, that means the full list is being shown
		var hiddenChildren = list.querySelectorAll('.hidden');
		var fullListShown = hiddenChildren.length <= App.config.following.showLatestEpisodes ? true : false;

		// short list length hardcoded to 2
		if (fullListShown === true) {
			var listChildren = list.querySelectorAll('li');
			for (var i = App.config.following.showLatestEpisodes; i < listChildren.length; i++) {
				listChildren[i].classList.toggle('hidden');
			}
			return showListBtn.textContent = 'Show all Episodes \u25BC';
		}

		for (var i = 0; i < hiddenChildren.length; i++) {
			hiddenChildren[i].classList.toggle('hidden');
		}
		return showListBtn.textContent = 'Hide Episodes \u25B2';

	}
	// document.getElementById('page-view').addEventListener('click', markWatched, false);

	// function markWatched (event) {
	// 	var isWatchBtn = event.target.classList.contains('watchedEpisode-js');
	// 	if ( event.target !== event.currentTarget && isWatchBtn ) {
	// 		console.log('true: ', event.target.className);
	// 		var showId = event.target.parentElement.dataset.showId;
	// 		var episodeId = event.target.parentElement.dataset.episodeId;
	// 		console.log(episodeId);
	// 		return FollowShows.toggleWatched(showId, episodeId);
	// 	}
	// }

	function addItem (showId) {
		// retrieve current following shows
		var followingShows = this.list();

		var exists = followingShows.some(function (val) {
			return val == showId;
		});

		if (exists) {
			return;
		}

		followingShows.push(showId);

		return this.store('following_shows', followingShows);
	}

	function removeItem(showId) {
		var followingShows = this.list();

		var filteredList = followingShows.filter(function (val) {
			return val != showId;
		});

		return this.store('following_shows', filteredList);
	}

	function store(key, data) {
		if (!window.localStorage) {
			throw new Error('Your browser does not support localStore.');
		};

		try {
			localStorage.setItem(key, JSON.stringify(data));
			return true;
		} catch (err) {
			console.log(err.message);
		}

		return false;

	}

	function list () {
		var shows = JSON.parse(localStorage.getItem('following_shows'));
		if (shows) {
			return shows;
		}
		return [];
	}

	function isFollowing(showId) {
		var list = this.list();
		if (list) {
			return list.some(function (val) {
				return val == showId;
			});
		}

		return false;
	}

	function addWatchedEpisode (showId, episodeId) {

		if (!window.localStorage) {
			throw new Error('Your browser does not support localStore.');
		};

		var watchedEpisodes = getWatchedEpisodes();

		// check there are any watched episodes in that show
		var watchedExists = watchedEpisodes.some(function (val) {
			return val.id === showId;
		});

		if (!watchedExists) {
			// create a new entry
			watchedEpisodes.push(
				{
					id: showId,
					episodes: [episodeId]
				}
			);
			return store('watched_episodes', watchedEpisodes);
		}

		watchedEpisodes.forEach(function (val) {
			if (val.id === showId) {
				var exists = val['episodes'].some(function (el) {
					return el === episodeId;
				});
				if (!exists) {
					val['episodes'].push(episodeId);
				}
				// throw exception: episode already watched
			}			
		});
		
		return store('watched_episodes', watchedEpisodes);
	}

	function removeWatchedEpisode(showId, episodeId) {
		// get showid
		var watchedEpisodes = getWatchedEpisodes();
		// get episode
		watchedEpisodes.forEach(function (val) {
			if (val.id === showId.toString()) {
				var index = val['episodes'].indexOf(episodeId.toString());
				if ( index > -1) {
					val['episodes'].splice(index, 1);
				}
			}
		});
		return store('watched_episodes', watchedEpisodes);
	}

	function getWatchedEpisodes (showId) {
		var watchedArray = JSON.parse(localStorage.getItem('watched_episodes'));

		if (!watchedArray) {
			return [];
		}

		if (showId) {
			var result = watchedArray.filter(function (val) {
				return val.id.toString() === showId;
			});

			if (!result) {
				return {
					id: showId,
					episodes: []
				};
			};

			return result;
		}

		return watchedArray;

	}

	// get an array of episodes from the most recent season
	function getRecentSeason(episodes) {
		var recentSeasonId = episodes.pop().season;
		return episodes.filter(function (val) {
			return val.season === recentSeasonId;
		});
	}

	function checkWatched (episodeId) {

		var watchedEpisodes = getWatchedEpisodes();

		var isWatched = watchedEpisodes.filter(function (val) {
			if (val.episodes.indexOf(episodeId.toString()) < 0) {
				return false;
			}
			return true;
		});
		if (isWatched.length > 0) {
			return true;
		}

		return false;
	}

	function addWatchedEventListener () {
		var watchedButtons = document.getElementsByClassName('watchedEpisode-js');
		for (var i = 0; i < watchedButtons.length; i++) {
			watchedButtons[i].addEventListener('click', watchedEvent, false);
		}
	}

	function watchedEvent () {
		var episodeId = this.parentElement.dataset.episodeId;
		var showId = this.parentElement.dataset.showId;
		toggleWatched(showId, episodeId);
	}

	function toggleWatched (showId, episodeId) {
		var watched = checkWatched(episodeId);

		if (watched) {
			return unwatchEpisode(showId, episodeId);
		}
		return watchEpisode(showId, episodeId);
	}

	function unwatchEpisode (showId, episodeId) {
		if (removeWatchedEpisode(showId, episodeId)) {
			var button = document.querySelector('[data-episode-id="' + episodeId + '"] .watchedEpisode-js') 
			button.classList.toggle('is-watched');
			button.textContent = 'Mark watched';
		}
	}

	function watchEpisode (showId, episodeId) {
		if (addWatchedEpisode(showId, episodeId)) {
			var button = document.querySelector('[data-episode-id="' + episodeId + '"] .watchedEpisode-js') 
			button.classList.toggle('is-watched');
			button.textContent = 'Watched';
		}
	}

	function populateShowInfo(shows) {
		return Promise.all(shows.map(getShows));
	}

	function getShows(show) {
		return new Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', 'http://api.tvmaze.com/shows/' + show + '?embed=episodes');
			xhr.onload = function () {
				if ( this.status >= 200 && this.status < 300 ) {
					resolve(JSON.parse(xhr.response));
				} else {
					reject({
						status: this.status,
						statusText: xhr.statusText
					});
				}
			};
			xhr.onerror = function () {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			};

			xhr.send();
		});
	}

	function render () {
		console.log('following render');
		var el = document.getElementById('page-view');
		var list = this.list();
		populateShowInfo(list).then(function (results) {
			console.log(results);
			var str = '<div id="following-shows">';
			str += '<div class="row">';
			str += '<div class="small-12 columns">';
			results.forEach(function (val) {

				var recentSeasonArray = getRecentSeason(val['_embedded']['episodes']);
				recentSeasonArray.forEach(function (el) {
					el['watched'] = checkWatched(el.id);
				});

				recentSeasonArray.sort(Util.compareByDates);

				var showId = val.id;
				str+= '<div class="media-object">';
					str+= '<div class="media-object-section">'
					if (val.image) {
						str+= '<div class="thumbnail">';
						str+= '<img src="' + val.image.medium + '">';
						str+= '</div>';
					}
					str+= '</div>';
					str+= '<div class="media-object-section" style="width: 100%;">';
						// str+= '<div style="vertical-align: middle" data-show-id="' + val.show.id + '"><strong>' + val.show.name + ' on ' + val.show.network.name + '</strong>';
						// if (val.isFollowing) {
						// 	str+= '<a class="tiny button is-following followShow-js">Following</a></div>';
						// } else {
						// 	str+= '<a class="tiny button followShow-js">Follow</a></div>';
						// }
						// str+= '<p> S' + val.season + 'E' + val.number + ' ' + val.name + ' at ' + val.airtime;
						str+= '<div style="vertical-align: middle; overflow: hidden;" data-show-id="' + val.id + '">';
						str+= '<strong>' + val.name + ' on ' + val.network.name + '</strong>';
						str+= '<ul style="list-style: none;margin-bottom: 0;">';
						str+= '<div style="text-align: center;"><em><small>- Latest Episode - </small></em></div>';
						recentSeasonArray.forEach(function (val, index) {
							var isHidden = index >= App.config.following.showLatestEpisodes ? 'hidden' : '';
							str+= '<li class="' + isHidden + '" ';
							str += 'style="border:1px solid #ccc;padding: 10px 5px 10px 10px;overflow:hidden;" data-show-id="' + showId + '" data-episode-id="' + val.id + '">';
							var date = new Date(val.airstamp);
							// console.log(val.airstamp);
							// console.log(DatePicker.today().toLocaleDateString());
							console.log(DatePicker.today().toLocaleDateString(), date.toLocaleDateString());
							console.log(DatePicker.today().toLocaleDateString() < date.toLocaleDateString());
							if (+DatePicker.today().toLocaleDateString() < +date.toLocaleDateString()) {
								str+='upcoming';
							}
							var airedOn = date.getMonth() + '/' + date.getDate() + '/' + date.getFullYear();
							str+= 'S' + val.season + 'E' + val.number + ' ' + val.name + ' aired on ' + airedOn;
							if (val.watched) {
								str+= '<a class="float-right watchedEpisode-js is-watched button tiny">Watched';
							} else {
								str+= '<a class="float-right watchedEpisode-js button tiny">Mark watched';
							}
							str+= '</a>';
							str+= '</li>';
						});
						str+= '</ul>';
						str+= '<div style="margin-left: 20px;background-color: #ccc; text-align: center; cursor: pointer" class="showEpisodes-js">Show all Episodes \u25BC</div>';
						str+= '</div>';
					str+= '</div>';
				str+= '</div>';
			}.bind(this));
			str += '</div></div></div>'; 
			return el.innerHTML = str;
		}.bind(this), function (err) {
			console.log(err);
		}).then(function () {
			addWatchedEventListener();
			attachEventListeners();
		});
	}

	return {
		addItem: addItem,
		removeItem: removeItem,
		list: list,
		isFollowing: isFollowing,
		store: store,
		toggleWatched: toggleWatched,
		checkWatched: checkWatched,
		render: render
	}
})();

var TvListing = (function () {

	var httpRequest;
	var listingDate = new Date();

	var picker = new Pikaday({
		field: document.getElementById('today-js'),
		position: 'bottom left',
		reposition: false,
		defaultDate: listingDate,
		setDefaultDate: true,
		onSelect: function (date) {
			picker.value = picker.toString();
			updateListingDate(picker.toString());
			getListing(picker.toString());
		}
	});

	updateListingDate(DatePicker.today());
	
	// events
	document.getElementById('prev-date-js').onclick = function () {
		var newDate = DatePicker.yesterday(listingDate);
		picker.setDate(newDate);
		// updateListingDate(newDate);
		// getListing(newDate);
	}

	document.getElementById('next-date-js').onclick = function () {
		var newDate = DatePicker.tomorrow(listingDate);
		picker.setDate(newDate);
		// updateListingDate(newDate);
		// getListing(newDate);
	}

	function attachEventListeners() {
		document.getElementById('tv-listing').addEventListener('click', markWatched, false);
	}

	function markWatched (event) {
		var isWatchBtn = event.target.classList.contains('watchedEpisode-js');
		if ( event.target !== event.currentTarget && isWatchBtn ) {
			console.log('true: ', event.target.className);
			var showId = event.target.parentElement.dataset.showId;
			var episodeId = event.target.parentElement.dataset.episodeId;
			console.log(episodeId);
			return FollowShows.toggleWatched(showId, episodeId);
		}
	}

	function addFollowShowEventListener() {
		var followShowButtons = document.getElementsByClassName('followShow-js');
		for (var i = 0; i < followShowButtons.length; i++) {
			followShowButtons[i].addEventListener('click', followShowClicked, false);
		}
	}

	function followShowClicked() {
		console.log('follow show clicked');
		var showId = this.parentElement.dataset.showId;
		var isFollowing = FollowShows.isFollowing(showId);

		if (isFollowing) {
			unfollowShow(showId);
		} else {
			followShow(showId);
		}
	}

	function unfollowShow(showId) {
		if (FollowShows.removeItem(showId)) {
			var button = document.querySelector('[data-show-id="' + showId + '"] .followShow-js') 
			button.classList.toggle('is-following');
			button.textContent = 'Follow';
		}
	}

	function followShow(showId) {
		if (FollowShows.addItem(showId)) {
			var button = document.querySelector('[data-show-id="' + showId + '"] .followShow-js') 
			button.classList.toggle('is-following');
			button.textContent = 'Following';
		}
	}

	function updateListingDate(date) {
		listingDate = date;
		console.log(listingDate);
		// picker.setDate(listingDate);
	}

	getListing(listingDate);
	
	function getListing(date) {
		var date = new Date(date),
			dateString = '',
			year = date.getFullYear(),
			month = date.getMonth() + 1,
			day = date.getDate();
		dateString += year + '-';
		dateString += ((parseInt(month)) < 10) ? '0' + month : month;
		dateString += '-';
		dateString += (day < 10) ? '0' + day : day;
		makeRequest('http://api.tvmaze.com/schedule?country=US&date=' + dateString);
	}

	function makeRequest(url) {
		httpRequest = new XMLHttpRequest();

		if (!httpRequest) {
			console.log("Failed to create XMLHTTP instance");
			return false;
		}

		httpRequest.onreadystatechange = formatPrimeTimeShows;
		httpRequest.open('GET', url);
		httpRequest.send();
	}

	function formatPrimeTimeShows() {
		var primeTimeSlots = ['20:00', '20:30', '21:00'];
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === 200) {
				var listing = JSON.parse(httpRequest.responseText);

				// convert object to array
				var listingArray = Object.keys(listing).map(function (key) {
					return listing[key];
				});

				var primeTime = listingArray.filter(function (val) {
					return primeTimeSlots.some(function (value) {
						return val.airtime == value;
					});
				});

				// add following data
				var following = FollowShows.list();
				console.log(following);
				var primeTimeWithFollowing = primeTime.map(function (val) {
					var isFollowing = following.some(function (value) {
						return val.show.id == value;
					});
					if (isFollowing) {
						val['isFollowing'] = true;
					} else {
						val['isFollowing'] = false;
					}
					val['isWatched'] = FollowShows.checkWatched(val.id);
					return val;
				});				

				console.log(primeTimeWithFollowing);
				var str = '<div id="tv-listing">';

				primeTimeWithFollowing.forEach(function (val) {
					str+= '<div class="media-object">';
						str+= '<div class="media-object-section">'
						if (val.show.image) {
							str+= '<div class="thumbnail">';
							str+= '<img src="' + val.show.image.medium + '">';
							str+= '</div>';
						}
						str+= '</div>';
						str+= '<div class="media-object-section" style="width: 100%;">';
							str+= '<div style="vertical-align: middle; overflow: hidden;" data-show-id="' + val.show.id + '">';
							str+= '<strong>' + val.show.name + ' on ' + val.show.network.name + '</strong>';
							if (val.isFollowing) {
								str+= '<a class="tiny button is-following float-right followShow-js">Following</a>';
							} else {
								str+= '<a class="tiny button float-right followShow-js">Follow</a>';
							}
							str+= '</div>'; // title
							str+= '<div class="callout" style="overflow: hidden;" data-show-id="' + val.show.id + '" data-episode-id="' + val.id + '"> S' + val.season + 'E' + val.number + ' ' + val.name;
							str+= '<span class="secondary label float-right">' + val.airtime + '</span>';
							if (val.isFollowing) {
								if (val.isWatched) {
									str+= '<a class="small button float-right is-watched watchedEpisode-js">Watched</a>';
								} else {
									str+= '<a class="small button float-right watchedEpisode-js">Mark watched</a>';
								}
							}
							str+= '</div>';
						str+= '</div>';
					str+= '</div>';
				});

				str+= '</div>';

				document.getElementById('page-view').innerHTML = str;
				addFollowShowEventListener();
				attachEventListeners();
				return str;
			}
		}
	}

	var render = function () {
		var el = document.getElementById('page-view');
		var str = formatPrimeTimeShows();
		return el.innerHTML = str; 
	}

	return {
		render: render
	}

})();

var SearchShows = (function () {

	function showSearchBar () {
		var str = '';
		str += '<div>Search</div>'
		return str;
	}

	var render = function () {
		var el = document.getElementById('page-view');
		var str = '';
		str+= showSearchBar();
		return el.innerHTML = str;
	}

	return {
		render: render
	}
})();

var App = (function () {
	var config = {
		following: {
			showLatestEpisodes: 1
		}
	};

	return {
		config: config
	}
	// add event listeners to page-view
})();

// Router
var Router = {
	routes: [],
	root: '/',
	init: function () {
		this.events();
		console.log("routes: ", this.routes);
	},
	events: function () {
		window.addEventListener('hashchange', function () {
			var newUrl = window.location.hash;
			this.updateNavBar(newUrl);
			
			var thisRoute = this.routes.filter(function (val) {
				return val.re === newUrl.substr(1);
			});

			return thisRoute[0].handler();
		}.bind(this));	
	},
	add: function (route, callback) {
		this.routes.push({re: route, handler: callback});
	},

	updateNavBar: function (newUrl) {
		var nav = document.getElementById('mainNav-js');
		// remove .active
		nav.querySelector('.active').classList.remove('active');
		// add .active
		return nav.querySelector('a[href="' + newUrl + '"]').parentElement.classList.add('active');
	}
};

Router.init();

Router.add('/following', function () {
	FollowShows.render();
	document.getElementById('date-picker').classList.add('hidden');
});

Router.add('/listing', function () {
	TvListing.render();
	document.getElementById('date-picker').classList.remove('hidden');
});

Router.add('/search', function () {
	SearchShows.render();
	document.getElementById('date-picker').classList.add('hidden');
});

