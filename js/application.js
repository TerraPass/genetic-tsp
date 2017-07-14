import {World, getCityFactory, CityPlacement} from 'js/world.js';
import {WorldView, CurrentStateView} from 'js/view.js';
import {GeneticAlgorithm, BasicTSPGeneticAlgorithmImpl} from 'js/genetic.js';

class UI
{
    // TODO: Remove unneeded parameter(s) and field(s).
    constructor(application, canvas, configFormContainer, mainControlsContainer, loadingIndicatorContainer)
    {
        this._app = application;
        this._canvas = canvas;
        this._configFormContainer = configFormContainer;
        this._configForm = this._configFormContainer.find('#configForm');
        this._mainControlsContainer = mainControlsContainer;
        this._loadingIndicatorContainer = loadingIndicatorContainer;

        var rawCanvas = $('#canvas')[0];
        UI._fitCanvasToParent(rawCanvas, 0.45*$(window).height());

        var canvas = new fabric.StaticCanvas('canvas');
        
        this._app.canvas = canvas;
        this._app.ui = this;

        if(!canvas)
        {
            throw new Error("Canvas is not supported");
        }

        this._scaffold = {
            width   : canvas.width,
            height  : canvas.height,
            centerX : canvas.width / 2,
            centerY : canvas.height / 2,
            radius  : 0.4 * Math.min(canvas.width, canvas.height)
        };

        //UI._drawScaffold(canvas, this._scaffold);

        // To be used as this in closures
        var self = this;
        
        // Setup config form submission
        this._configForm.on(
            'submit',
            function () {
                self._onConfigSubmit(true);
                self._closeConfigForm();
            }
        );
        
        // Setup config form cancel button
        this._configCancelButton = this._configFormContainer.find('#cancelButton');
        this._configCancelButton.on(
            'click',
            () => self._closeConfigForm()
        );

        // Setup play/pause button
        this._playPauseButton = this._mainControlsContainer.find('#playPauseButton');
        this._playPauseButton.on(
            'click',
            () => self._app.togglePause()
        );

        // Setup restart button
        this._restartButton = this._mainControlsContainer.find('#restartButton');
        this._restartButton.on(
            'click',
            function()
            {
                var wasPaused = self._app.isPaused;
                self._app.pause();
                self._onConfigSubmit(true);
                if(wasPaused)
                {
                    self._app.pause();
                }
            }
        );

        this._onConfigSubmit(false);
        this._openConfigForm();
    }

    _enableConfigCancelButton()
    {
        this._configCancelButton.removeAttr('disabled');
    }

    _openConfigForm()
    {
        this._loadingIndicatorContainer.hide();
        this._mainControlsContainer.hide();
        this._configFormContainer.show();
    }
    
    _closeConfigForm()
    {
        this._configFormContainer.hide();
        this._mainControlsContainer.show();
    }

    _onConfigSubmit(run)
    {
        this._app.reinit(UI._getFormAsObject(this._configForm), this._scaffold, run);
        this._enableConfigCancelButton();
    }

    update(currentState, allTimeBestDistance, allTimeBestGeneration, allTimeBestSequence)
    {
        this._mainControlsContainer.find('#generationNumber').text(currentState.generation);

        var samples = ['best', 'median', 'worst'];
        for(var i in samples)
        {
            this._mainControlsContainer.find('#'+samples[i]+'Distance').text(currentState[samples[i]+'Genome'].distance.toPrecision(6));
            this._mainControlsContainer.find('#'+samples[i]+'Fitness').text(currentState[samples[i]+'Fitness'].toPrecision(6));
        }
        
        this._mainControlsContainer.find('#allTimeBestDistance').text(allTimeBestDistance.toPrecision(6));
        this._mainControlsContainer.find('#allTimeBestGeneration').text(allTimeBestGeneration);
//        this._mainControlsContainer.find('#allTimeBestSequence').text(allTimeBestSequence.toString());

        // Function, yielding the data object for all-time best marker on the plot
        var getAllTimeBestObject = function (generation, distance) {
            return {
                name : 'all-time best',
                x : [generation],
                y : [distance],
                mode : 'markers',
                marker : {
                color : 'rgb(231, 76, 60)',
                    size : 10,
                    symbol : 'star'
                }
            };
        };

        // If this is the first generation, reinit distance plot
        if(currentState.generation === 0)
        {
            var plot = this._mainControlsContainer.find('#plot');
            var plotWidth = this._mainControlsContainer.width()*0.86;
            //console.log(plotWidth);
            
            Plotly.newPlot(
                'plot',
                [
                    getAllTimeBestObject(0, allTimeBestDistance),
                    {
                        name : 'best',
                        x : [0],
                        y : [currentState.bestGenome.distance],
                        mode : 'lines',
                        line : {
                            color : '#000000'
                        }
                    },
                    {
                        name : 'median',
                        x : [0],
                        y : [currentState.medianGenome.distance],
                        mode : 'lines',
                        line : {
                            color : '#B0B0B0'
                        }
                    },
                    {
                        name : 'worst',
                        x : [0],
                        y : [currentState.worstGenome.distance],
                        mode : 'lines',
                        line : {
                            color : '#E0E0E0'
                        }
                    }
                ],
                {
                    margin : {
                        t : 0,
                        l : 0,
                        b : 0,
                        r : 0,
                        autoexpand : true
                    },
                    height : plot.height(),
                    width : plotWidth,
                    
                    showlegend : true,
                    legend : {
                        x : 1,
                        y : 1,
                        traceorder : 'reversed',
                        font : {size: 10},
                        //yref : 'paper',
                        bgcolor : 'transparent',
                        orientation : 'h'
                        
                    }
                },
                {
                    displayModeBar: false,
                    staticPlot: true
                }
            );
        }
        else    // Otherwise, update the plot with the data for the current generation
        {
            // If a breakthrough has just occurred
            if(allTimeBestGeneration === currentState.generation)
            {
                Plotly.deleteTraces('plot', 0);
                Plotly.addTraces(
                    'plot',
                    getAllTimeBestObject(allTimeBestGeneration, allTimeBestDistance),
                    0
                );
            }
            Plotly.extendTraces(
                'plot',
                {
                    x : Array(3).fill([currentState.generation]),
                    y : [
                        [currentState.bestGenome.distance],
                        [currentState.medianGenome.distance],
                        [currentState.worstGenome.distance]
                    ]
                },
                [1, 2, 3]
            );
        }
    }

    static _getFormAsObject(form)
    {
        var formArray = form.serializeArray();
        
        var returnArray = {};
        for (var i = 0; i < formArray.length; i++) {
            returnArray[formArray[i]['name']] = formArray[i]['value'];
        }
        return returnArray;
    }

    static _drawScaffold(canvas, scaffold)
    {
        var centerRect = new fabric.Rect({
            left    : scaffold.centerX - 4,
            top     : scaffold.centerY - 4,
            fill    : 'black',
            width   : 8,
            height  : 8,
            angle   : 0
        });

        var circle = new fabric.Circle({
            left    : scaffold.centerX - scaffold.radius,
            top     : scaffold.centerY - scaffold.radius,
            radius  : scaffold.radius,
            stroke  : 'black',
            fill    : 'transparent'
        });

        canvas.add(centerRect);
        canvas.add(circle);
    }

    // This function is based on the one taken from
    // https://stackoverflow.com/a/10215724
    static _fitCanvasToParent(rawCanvas, height)
    {
        if(typeof height === "number")
        {
            height = Math.floor(height) + "px";
        }

        height = height || null;

        // Make it visually fill the positioned parent
        rawCanvas.style.width ='100%';
        rawCanvas.style.height = height !== null ? height : '100%';
        // ...then set the internal size to match
        rawCanvas.width = rawCanvas.offsetWidth;
        rawCanvas.height = rawCanvas.offsetHeight;
    }
}

class Application
{
    constructor()
    {
        this._world = null;
        this._worldView = null;
        this._currentStateView = null;
        this._canvas = null;

        this._ui = null;

        this._geneticAlgorithm = null;
        
        this._interval = null;
    }

    set canvas(canvas)
    {
        this._canvas = canvas;
    }
    
    set ui(value)
    {
        this._ui = value;
    }

    reinit(config, scaffold, run)
    {
        if(run !== true && run !== false)
        {
            run = false;
        }
        
        var cityFactory = getCityFactory(scaffold, CityPlacement[config.cityPlacement]);

        this._world = new World(
            cityFactory,
            config.cityCount
        );

        this._geneticAlgorithm = new GeneticAlgorithm(
            new BasicTSPGeneticAlgorithmImpl(this._world.cities),
            config.populationSize,
            config.crossoverRate,
            config.mutationRate,
            config.eliteCount,
            config.eliteCopies
        );

        this._resetView(this._world);

        if(this._interval !== null)
        {
            clearInterval(this._interval);
        }

        this._allTimeBestDistance = this._geneticAlgorithm.allTimeBestGenome.distance;
        this._allTimeBestGeneration = this._geneticAlgorithm.allTimeBestGeneration;  // 0
//        this._allTimeBestSequence = this._geneticAlgorithm.allTimeBestGenome.sequence;

        if(run)
        {
            this.play();
        }
        
        this._updateUi();
    }
    
    play()
    {
        if(this._interval !== null)
        {
            return;
        }

        var self = this;

        this._interval = setInterval(                
            function()
            {
                //console.log("Generation " + self._geneticAlgorithm.currentState.generation);
                self._geneticAlgorithm.epoch();

                if(self._geneticAlgorithm.currentState.bestGenome.distance < self._allTimeBestDistance)
                {
                    self._allTimeBestDistance = self._geneticAlgorithm.currentState.bestGenome.distance;
                    self._allTimeBestGeneration = self._geneticAlgorithm.currentState.generation;
//                        self._allTimeBestSequence = self._geneticAlgorithm.currentState.bestGenome.sequence;
                }

                self._updateUi();
            },
            0 // GA update interval
        );
    }

    _updateUi()
    {
        this._currentStateView.refresh(this._geneticAlgorithm.currentState);
        this._ui.update(
            this._geneticAlgorithm.currentState, 
            this._allTimeBestDistance, 
            this._allTimeBestGeneration//,
            //this._allTimeBestSequence
        );
    }

    pause()
    {
        if(this._interval === null)
        {
            return;
        }
        clearInterval(this._interval);
        this._interval = null;
    }
    
    get isPaused()
    {
        return (this._interval === null);
    }
    
    togglePause()
    {
        if(this.isPaused)
        {
            this.play();
        }
        else
        {
            this.pause();
        }
    }
    
//    _update()
//    {
//        console.log("Generation " + this._geneticAlgorithm.currentState.generation);
//        this._geneticAlgorithm.epoch();
//        this._ui.update(this._geneticAlgorithm.currentState);
//    }
    
    _resetView(world)
    {
        if(this._worldView !== null)
        {
            this._worldView.remove();
        }
        this._worldView = new WorldView(this._canvas, world);

        if(this._currentStateView !== null)
        {
            this._currentStateView.remove();
        }
        this._currentStateView = new CurrentStateView(this._canvas, world.cities);
    }
}

export {Application, UI};
