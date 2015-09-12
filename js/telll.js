/*******
telll classes
author: Monsenhor <filipo@kobkob.org>
Version: 0.15 2015 August

License: GPL Affero

**/

var Version = "0.15";

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


/**
  * class tws
  * 
  */

tws = function (server)
{
  this._init (server);
}


/**
 * Init
 */
tws.prototype._init = function (server)
{

this.m_server = server;
this.method;
this.url;
this.delimiter;
this.headers;
this.xhr;

}
/**
 * setHeaders
 */
tws.prototype.setHeaders = function (h)
{
this.headers = h;
}


/**
 * user 
 * 
 */
tws.prototype.user = function (data)
{
    console.log('Creating new user on tws');
    console.log(data);
    if (data.username && data.email && data.password){
        // call tws to create a new user

        var send = JSON.stringify(data);
        console.log(send);
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function(){
            console.log('Response');
            console.log(this.responseText);
        });
        xhr.open('POST', 'http://52.3.72.192:3000/app/user', true);
        for(var key in this.headers) {
                xhr.setRequestHeader(key, this.headers[key]);
        }
        xhr.send(send);
        return xhr;


    } else {
        console.log ("{error:'wrong user data'}");
        return "{error:'wrong user data'}";
    }
}


/**
 * login 
 * 
 */
tws.prototype.login = function (data)
{
var url = this.m_server+'/login';
var ptype = "POST";
this.headers = {"X-API-Key": 123}; 
var msg = "Login on tws ...";
    data.user_name = data.username;
    console.log(msg);
    console.log(data);
    if (data.username && data.password){
        // call tws to login
        var send = JSON.stringify(data);
        console.log(send);
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function(){
            console.log('Response');
            console.log(this.responseText);
            loginData = JSON.parse(this.responseText);
            this.headers = {"X-API-Key": 123, "X-Auth-Key": loginData.auth_key}; 
        });
        xhr.open(ptype , url, true);
        for(var key in this.headers) {
                xhr.setRequestHeader(key, this.headers[key]);
        }
        xhr.send(send);
        return xhr;
    } else {
        console.log ("{error:'wrong user data'}");
        return "{error:'wrong user data'}";
    }
}

/**
 * 
 * 
 */
tws.prototype.getPhotolink = function ()
{
	this.url = this.m_server+'/app/photolink/lp';
        var lp = new LongPolling("GET", "http://52.3.72.192:3000/app/photolink/lp", "\n//----------//", this.headers);
        //var lp = new LongPolling("GET", "http://52.3.72.192:3000/app/photolink/lp", "\n//----------//", {"X-Api-Key": 1234, "X-Auth-Key": "4574eb62ff5337ce17f3d657f3b74cbcf3f9cc42"});
        lp.create();
	return lp;
}

/**
 * 
 * 
 */
tws.prototype.sendPhotolink = function (str)
{
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://52.3.72.192:3000/app/photolink/send/0/0', true);
        for(var key in this.headers) {
                xhr.setRequestHeader(key, this.headers[key]);
        }

        xhr.send(str);
}

//////////////////////////////////////////////////////
// utilitie functions
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}
function checkCookie() {
    // TODO: do a real check ... :P
    var user = getCookie("email");
    if (user != "") {
        alert("Welcome again " + user);
    } else {
        user = prompt("Welcome! Please enter your email:", "");
        if (user != "" && user != null) {
            document.getElementById('email').value = user;
            //alert("Please enter your password and click on login button.");
        }
    }
}

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
      x: 14,
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
      x: 21,
      y: 45,
      t: 28
    }],
    stopped: 1,
    photolink: 1,
  },

  {
    points: [{
      x: 53,
      y: 50,
      t: 29
    }, {
      x: 53,
      y: 50,
      t: 30
    }, {
      x: 53,
      y: 50,
      t: 32
    }, {
      x: 53,
      y: 50,
      t: 33
    }, {
      x: 53,
      y: 50,
      t: 34
    }],
    stopped: 1,
    photolink: 2,
  }, {
    points: [{
      x: 50,
      y: 55,
      t: 36.5
    }, {
      x: 50,
      y: 55,
      t: 38
    }, {
      x: 50,
      y: 55,
      t: 39
    }, {
      x: 50,
      y: 55,
      t: 40
    }, {
      x: 51,
      y: 55,
      t: 42
    }],
    stopped: 1,
    photolink: 3,
  },

  {
    points: [{
      x: 46,
      y: 50,
      t: 47
    }, {
      x: 46,
      y: 50,
      t: 49
    }, {
      x: 46,
      y: 50,
      t: 51
    }, {
      x: 46,
      y: 50,
      t: 53
    }, {
      x: 46,
      y: 50,
      t: 54
    }],
    stopped: 1,
    photolink: 4,
  }, {
    points: [{
      x: 20,
      y: 50,
      t: 54
    }, {
      x: 20,
      y: 50,
      t: 55.3
    }, {
      x: 20,
      y: 50,
      t: 56.1
    }, {
      x: 20,
      y: 50,
      t: 56.8
    }, {
      x: 20,
      y: 50,
      t: 57.38
    }],
    stopped: 1,
    photolink: 5,
  }, {
    points: [{
      x: 45,
      y: 50,
      t: 55
    }, {
      x: 45,
      y: 50,
      t: 57.48
    }],
    stopped: 1,
    photolink: 6,
  }, {
    points: [{
      x: 70,
      y: 50,
      t: 56
    }, {
      x: 70,
      y: 50,
      t: 56.38
    }, {
      x: 70,
      y: 50,
      t: 57.58
    }],
    stopped: 1,
    photolink: 7,
  }, {
    points: [{
      x: 28,
      y: 60,
      t: 60
    }, {
      x: 20,
      y: 63,
      t: 61
    }, {
      x: 15,
      y: 65,
      t: 63
    }, {
      x: 13,
      y: 65,
      t: 64
    }, {
      x: 12,
      y: 66,
      t: 65
    }],
    stopped: 1,
    photolink: 8,
  }, {
    points: [{
      x: 20,
      y: 45,
      t: 67
    }, {
      x: 25,
      y: 55,
      t: 68
    }, {
      x: 30,
      y: 55,
      t: 71
    }, {
      x: 43,
      y: 55,
      t: 73
    }, {
      x: 45,
      y: 47,
      t: 74
    }],
    stopped: 1,
    photolink: 9,
  }, {
    points: [{
      x: 70,
      y: 60,
      t: 75
    }, {
      x: 55,
      y: 55,
      t: 77
    }, {
      x: 48,
      y: 50,
      t: 78
    }, {
      x: 47,
      y: 50,
      t: 79
    }, {
      x: 47,
      y: 50,
      t: 80
    }],
    stopped: 1,
    photolink: 10,
  },

];



// End DATA
