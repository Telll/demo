/*******
telll classes
author: Monsenhor <filipo@kobkob.org>
Version: 0.14 2015 August

License: GPL Affero

**/

var Version = "0.14";

/**
 * class Tws
 *
 */

Tws = function() {
  this._init();
}


/**
 * _init sets all Tws attributes to their default value.
 */
Tws.prototype._init = function() {
  /**
   *
   */
  this.m_movie = {};
  this.m_authKey = "0";

}

/**
 * getData
 * @param call
 * @param parJson
 *
 */
Tws.prototype.getData = function(call, parJson) {
  var result;
  //console.log('Call:');
  //console.log(call);
  //console.log('Parameters:');
  //console.log(parJson);
  if (call == 'movie') {
    result = TheMovie;
  }
  return result;
}

/**
 * getMovie
 * @param id
 *
 */
Tws.prototype.getMovie = function(id) {
  this.m_movie = this.getData('movie', [{
    'id': id
  }]);
  return this.m_movie;
}

/**
 * getMovies
 * @param query
 *
 */
Tws.prototype.getMovies = function(query) {
  return this.getData('movies', query);
}

/**
 * getTrackm
 * @param movieId
 * @param time
 *
 */
Tws.prototype.getTrackm = function(movieId, time) {
  return this.getData('trackm', [{
    'movieId': movieId,
    'time': time
  }]);
}


/**
 * getTrackms
 * @param movieId
 * @param time
 *
 */
Tws.prototype.getTrackms = function(movieId) {
  return this.getData('trackms', [{
    'movieId': movieId
  }]);
}

/**
 * getPhotolinks
 * @param movieId
 *
 */
Tws.prototype.getPhotolinks = function(movieId) {
  return this.getData('photolinks', [{
    'movieId': movieId
  }]);
}

/**
 * getPhotolink
 * @param Id
 *
 */
Tws.prototype.getPhotolink = function(id) {
  return this.getData('photolink', [{
    'id': id
  }]);
}


function LongPolling(method, url, delimiter, headers) {
  this.method = method;
  this.url = url;
  this.delimiter = delimiter || "\n//----------//";
  this.headers = headers;
  //this.xhr        = this._createXHR();
  this.xhr = null;
}

LongPolling.prototype = {
  _createXHR: function() {
    var xhr = new XMLHttpRequest();
    xhr.open(this.method, this.url, true);
    for (var key in this.headers) {
      xhr.setRequestHeader(key, this.headers[key]);
    }
    return xhr;
  },

  connect: function() {
    var index = 0;

    this.xhr.onreadystatechange = function() {
      if (this.xhr.readyState == 3) {
        var i = this.xhr.responseText.lastIndexOf(this.delimiter);
        if (i > index) {
          var newChunk = this.xhr.responseText.substr(index, (i - index));
          index = i + this.delimiter.length;
          if (newChunk != "alive?" && this.onData)
            setTimeout(this.onData.bind(this, newChunk), 0);

        }
      }
    }.bind(this);
    this.xhr.onabort = this.xhr.onerror = function() {
      this.xhr = this._createXHR();
      try {
        this.connect();
      } catch (err) {
        setTimeout(this.connect.bind(this), 100);
      }
    }.bind(this);
    this.xhr.send(null);
  },
  create: function() {
    this.xhr = this._createXHR();
  }
};

//////////////////////////////////////////////////////
// DATA
TheMovie = {
  id: 0,
  title: "Ocean's 13",
  url: "mov/ocean_13.mp4",
  player: "default",
};

var myPhotolinks = [{
  id: 0,
  thumb: "img/photolinks/photolinks_ocean_13.00_180x90.jpg",
  links: [{
    id: "0",
    title: "Brad Pitt - IMDB",
    description: "While Brad Pitt is walking",
    url: " http://www.imdb.com/name/nm0000093/?ref_=nv_sr_1"
  }, ]
}, {
  id: 1,
  thumb: "img/photolinks/photolinks_ocean_13.01_180x90.jpg",
  links: [{
    id: "1",
    title: "Ted Baker suit - Nordstrom",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vel interdum magna ...",
    url: "http://shop.nordstrom.com/c/mens-suits-sportcoats"
  }]
}, {
  id: 2,
  thumb: "img/photolinks/photolinks_ocean_13.02_180x90.jpg",
  links: [{
    id: "2",
    title: "George Clooney -  IMDB",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vel interdum magna ...",
    url: "http://www.imdb.com/name/nm0000123/"
  }]
}, {
  id: 3,
  thumb: "img/photolinks/photolinks_ocean_13.03_180x90.jpg",
  links: [{
    id: "3",
    title: "Armani suit - Celebrity Suit Shop",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vel interdum magna ...",
    url: "http://www.celebritysuitshop.com/product-category/movie-suits/oceans-11-12-and-13-suits/"
  }]
}, {
  id: 4,
  thumb: "img/photolinks/photolinks_ocean_13.04_180x90.jpg",
  links: [{
    id: "4",
    title: "Las Vegas Travel",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vel interdum magna ...",
    url: "http://lasvegas.com"
  }]
}, {
  id: 5,
  thumb: "img/photolinks/photolinks_ocean_13.05_180x90.jpg",
  links: [{
    id: "5",
    title: "Bellagio",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vel interdum magna ...",
    url: "https://www.bellagio.com/hotel/"
  }]
}, {
  id: 6,
  thumb: "img/photolinks/photolinks_ocean_13.06_180x90.jpg",
  links: [{
    id: "6",
    title: "MGM Grand",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vel interdum magna ...",
    url: "https://www.mgmgrand.com"
  }]
}, {
  id: 7,
  thumb: "img/photolinks/photolinks_ocean_13.07_180x90.jpg",
  links: [{
    id: "7",
    title: "Luxor",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vel interdum magna ...",
    url: "http://www.luxor.com"
  }]
}, {
  id: 8,
  thumb: "img/photolinks/photolinks_ocean_13.08_180x90.jpg",
  links: [{
    id: "8",
    title: "Ghurka vintage bag ",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vel interdum magna ...",
    url: "http://www.ghurka.com/cavalier-i-leather-duffel-bag-vintage-chestnut"
  }]
}, {
  id: 9,
  thumb: "img/photolinks/photolinks_ocean_13.09_180x90.jpg",
  links: [{
    id: "9",
    title: "John Varvatos bag ",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vel interdum magna ...",
    url: "https://www.johnvarvatos.com/moto-braid-duffle/4380241-CIP.html?dwvar_4380241-CIP_size=OSZ&dwvar_4380241-CIP_color=001#start=1"
  }, ]
}, {
  id: 10,
  thumb: "img/photolinks/photolinks_ocean_13.10_180x90.jpg",
  links: [{
    id: "10",
    title: "Ford Taurus ",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vel interdum magna ...",
    url: "http://www.ford.com/cars/taurus/"
  }]
}, ];

trackms = [{
    points: [{
      x: 10,
      y: 45,
      t: 0.8
    }, {
      x: 12,
      y: 40,
      t: 5
    }, {
      x: 17,
      y: 45,
      t: 8
    }, {
      x: 18,
      y: 45,
      t: 12
    }, {
      x: 15,
      y: 40,
      t: 14
    }],
    stopped: 1,
    photolink: 0,
  }, {
    points: [{
      x: 15,
      y: 40,
      t: 14.43
    }, {
      x: 16,
      y: 41,
      t: 17
    }, {
      x: 17,
      y: 42,
      t: 20
    }, {
      x: 18,
      y: 43,
      t: 25
    }, {
      x: 17,
      y: 45,
      t: 28
    }],
    stopped: 1,
    photolink: 1,
  },

  {
    points: [{
      x: 55,
      y: 50,
      t: 29
    }, {
      x: 54,
      y: 51,
      t: 30
    }, {
      x: 53,
      y: 52,
      t: 32
    }, {
      x: 54,
      y: 51,
      t: 33
    }, {
      x: 55,
      y: 50,
      t: 34
    }],
    stopped: 1,
    photolink: 2,
  }, {
    points: [{
      x: 20,
      y: 30,
      t: 36.5
    }, {
      x: 20,
      y: 30,
      t: 38
    }, {
      x: 20,
      y: 30,
      t: 39
    }, {
      x: 20,
      y: 30,
      t: 40
    }, {
      x: 20,
      y: 30,
      t: 42
    }],
    stopped: 1,
    photolink: 3,
  },

  {
    points: [{
      x: 20,
      y: 30,
      t: 48
    }, {
      x: 20,
      y: 30,
      t: 50
    }, {
      x: 20,
      y: 30,
      t: 52
    }, {
      x: 20,
      y: 30,
      t: 54
    }, {
      x: 20,
      y: 30,
      t: 56
    }],
    stopped: 1,
    photolink: 4,
  }, {
    points: [{
      x: 20,
      y: 30,
      t: 54.55
    }, {
      x: 20,
      y: 30,
      t: 55.3
    }, {
      x: 20,
      y: 30,
      t: 56.1
    }, {
      x: 20,
      y: 30,
      t: 56.8
    }, {
      x: 20,
      y: 30,
      t: 57.38
    }],
    stopped: 1,
    photolink: 5,
  }, {
    points: [{
      x: 20,
      y: 30,
      t: 54.55
    }, {
      x: 20,
      y: 30,
      t: 57.38
    }],
    stopped: 1,
    photolink: 6,
  }, {
    points: [{
      x: 19,
      y: 30,
      t: 54.55
    }, {
      x: 20,
      y: 30,
      t: 56.38
    }, {
      x: 20,
      y: 30,
      t: 57.38
    }],
    stopped: 1,
    photolink: 7,
  }, {
    points: [{
      x: 20,
      y: 30,
      t: 60
    }, {
      x: 20,
      y: 30,
      t: 61
    }, {
      x: 20,
      y: 30,
      t: 63
    }, {
      x: 20,
      y: 30,
      t: 64
    }, {
      x: 20,
      y: 30,
      t: 65
    }],
    stopped: 1,
    photolink: 8,
  }, {
    points: [{
      x: 20,
      y: 30,
      t: 67
    }, {
      x: 20,
      y: 30,
      t: 69
    }, {
      x: 20,
      y: 30,
      t: 71
    }, {
      x: 20,
      y: 30,
      t: 72
    }, {
      x: 20,
      y: 30,
      t: 74
    }],
    stopped: 1,
    photolink: 9,
  }, {
    points: [{
      x: 20,
      y: 30,
      t: 75
    }, {
      x: 20,
      y: 30,
      t: 77
    }, {
      x: 20,
      y: 30,
      t: 78
    }, {
      x: 20,
      y: 30,
      t: 79
    }, {
      x: 20,
      y: 30,
      t: 80
    }],
    stopped: 1,
    photolink: 10,
  },

];



// End DATA
