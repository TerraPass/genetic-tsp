import {Application, UI} from 'js/application.js';
//import {World, CircularCityFactory} from 'js/world.js';

//var canvas = null;
var app = null;
var ui = null;

$(function() {
    app = new Application();
    ui = new UI(app, $('#canvas'), $('#configFormContainer'), $('#mainControlsContainer'));
});
