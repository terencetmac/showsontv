// Todo
// Router

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

var FollowShows = (function () {
	var following = [];

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

		return this.store(followingShows);
	}

	function removeItem(showId) {
		var followingShows = this.list();

		var filteredList = followingShows.filter(function (val) {
			return val != showId;
		});

		return this.store(filteredList);
	}

	function store(data) {
		if (!window.localStorage) {
			throw new Error('Your browser does not support localStore.');
		};

		try {
			localStorage.setItem('following_shows', JSON.stringify(data));
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

	return {
		addItem: addItem,
		removeItem: removeItem,
		list: list,
		isFollowing: isFollowing,
		store: store
	}
})();

(function () {
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

	function addFollowShowEventListener() {
		var followShowButtons = document.getElementsByClassName('followShow-js');
		for (var i = 0; i < followShowButtons.length; i++) {
			followShowButtons[i].addEventListener('click', followShowClicked, false);
		}
	}

	function followShowClicked() {
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
		var primeTimeSlots = ['20:00', '20:30'];
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
					return val;
				});
				console.log(primeTimeWithFollowing);
				var str = '';
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
							str+= '<div style="vertical-align: middle" data-show-id="' + val.show.id + '"><strong>' + val.show.name + ' on ' + val.show.network.name + '</strong>';
							if (val.isFollowing) {
								str+= '<a class="tiny button is-following followShow-js">Following</a></div>';
							} else {
								str+= '<a class="tiny button followShow-js">Follow</a></div>';
							}
							str+= '<p> S' + val.season + 'E' + val.number + ' ' + val.name + ' at ' + val.airtime;
							str+= '<a class="small button secondary float-right">Mark as watched</a>';
							str+= '</p>';
						str+= '</div>';
					str+= '</div>';
				});

				document.getElementById('xyz').innerHTML = str;
				addFollowShowEventListener();
			}
		}
	}

})();
