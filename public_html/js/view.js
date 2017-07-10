import * as debug from 'js/debug.js';

class CityView
{    
    constructor(canvas, city)
    {
        this._canvas = debug.ensureNotNull(canvas, "canvas");
        this._city = debug.ensureNotNull(city, "city");

        const RADIUS = 3;

        this._graphic = new fabric.Circle({
            left    : this._city.x - RADIUS,
            top     : this._city.y - RADIUS,
            radius  : RADIUS,
            stroke  : 'black',
            fill    : 'transparent'
        });

        this._canvas.add(this._graphic);
    }

    remove()
    {
        this._canvas.remove(this._graphic);
    }
}

class WorldView
{
    constructor(canvas, world)
    {
        this._canvas = debug.ensureNotNull(canvas, "canvas");
        this._world = debug.ensureNotNull(world, "world");

        this._cityViews = [];
        
        for(var i = 0; i < this._world.cityCount; i++)
        {
            this._cityViews[i] = new CityView(this._canvas, this._world.cities[i]);
        }
    }

    remove()
    {
        this._cityViews.forEach((view) => view.remove());
    }
}

class RouteView
{
    constructor(canvas, cities, sequence, color)
    {
        this._canvas = canvas;
        this._cities = cities;

        this._poly = new fabric.Polygon(
            sequence.map(
                (index) => ({x : cities[index].x, y : cities[index].y})
            ),
            {
                stroke: color,
                fill: "transparent"
            }
        );

        this._canvas.add(this._poly);
    }

    remove()
    {
        this._canvas.remove(this._poly);
    }
}

class CurrentStateView
{
    constructor(canvas, cities)
    {
        this._canvas = canvas;
        this._cities = cities;
        
        this._bestRouteView = null;
        this._medianRouteView = null;
        this._worstRouteView = null;
    }

    refresh(currentState)
    {
        const BEST_COLOR    = "#000000";
        const MEDIAN_COLOR  = "#D0D0D0";
        const WORST_COLOR   = "#F8F8F8";

        this.remove();

        this._worstRouteView = new RouteView(this._canvas, this._cities, currentState.worstGenome.sequence, WORST_COLOR);
        this._medianRouteView = new RouteView(this._canvas, this._cities, currentState.medianGenome.sequence, MEDIAN_COLOR);
        this._bestRouteView = new RouteView(this._canvas, this._cities, currentState.bestGenome.sequence, BEST_COLOR);
    }

    remove()
    {
        if(this._worstRouteView !== null)
        {
            this._worstRouteView.remove();
        }
        if(this._medianRouteView !== null)
        {
            this._medianRouteView.remove();
        }
        if(this._bestRouteView !== null)
        {
            this._bestRouteView.remove();
        }
    }
}

export {CityView, WorldView, CurrentStateView};
