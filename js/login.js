/* login.js
 * require telll.js Version 0.15
 */
var theHeight;
var authKey;
var deviceModel='iPad';
var devicePhotolinks=[];
var user;

jQuery.noConflict();
jQuery( document ).ready(function( $ ) {

    $( window ).resize(function() {
        _fullWindow();
    });

    $("#login-button").click(function(){
         window.location.assign("clickbox.html");
         return false;
    });
    $(".logo-86x86").on('click', function(){
         alert('telll');
         window.location.assign("telll.html");
         return false;
    });


   checkCookie();

   _fullWindow();

    ///////////////////////////////////////////////////////





    /** createPhotolink
     * @param j : the photolink dom obj
     */
    function createPhotolink (j){
        var saas = new tws('http://52.3.72.192:3000');
        var data = {
            'username': "mock_01",
            'password': "blablabla",
            'model':'iPad'
        };
        //user = new User(data);
        var xhr = saas.login(data);
        xhr.addEventListener('load', function(){
            console.log(this.responseText);
            var jsData = JSON.parse(this.responseText);
            if (jsData.error) alert(jsData.error);
            authKey = jsData.auth_key;
            saas.setHeaders({"X-API-Key": 123, "X-Auth-Key": authKey});
	var phData = "{'error':'unknown'}";
	    lp = saas.getPhotolink();
	    lp.onData = function(data) {
	        phData = data;
	        jsData = JSON.parse(phData);
	        console.log('got!');
	        console.log(jsData);
                console.log(myPhotolinks);
                plId = jsData.id;
                myPl = {};
                for(i=0; i<myPhotolinks.length;i++){
                    console.log(plId);
                    console.log(myPhotolinks[i].id);
                    if(myPhotolinks[i].id == plId) myPl = myPhotolinks[i];
                }
                console.log(myPl.thumb.replace('_180x90',''));
                $('#photolink-image a').attr('href', myPl.links[0].url);
	        $('#photolink-image').css('background-image','url('+myPl.thumb.replace('_180x90','')+')');
                console.log(j);
                $('#photolink-image').fadeIn();
                $('#photolink-list').fadeOut();
                updatePhotolinksList(myPl);
                // return to list view in 15 seconds
                setTimeout(function(){
                    $('#photolink-image').fadeOut();
                    $('#photolink-list').fadeIn();
                },15000);
	    };
	lp.connect();

        });
    }

    /** Full window
    * Adjust viewport to full window
    */
    function _fullWindow(){
        $('#telll-content').width($(window).width());
        $('#telll-content').height($(window).height());
        theHeight = $(window).height();
    }
 });
