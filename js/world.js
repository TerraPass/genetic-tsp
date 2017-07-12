import * as debug from 'js/debug.js';

var CityPlacement = Object.freeze({
    MANUAL      : 0,
    RANDOM      : 1,
    CIRCULAR    : 2
});

class City
{
    constructor(id, x, y)
    {
        this._id = id;
        this._x = x;
        this._y = y;
    }

    get id()
    {
        return this._id;
    }
    
    get x()
    {
        return this._x;
    }
    
    get y()
    {
        return this._y;
    }
}

class CircularCityFactory
{
    constructor(centerX, centerY, radius)
    {
        this._centerX = centerX;
        this._centerY = centerY;
        this._radius = radius;
    }

    makeCity(number, totalCities)
    {
        debug.ensure(totalCities > 0, totalCities, "totalCities", "totalCities must be a positive integer");
        debug.ensure(number >= 0 && number < totalCities, number, "number", "number must be between 0 and ${totalCities}");

        var theta = (number/totalCities) * (2*Math.PI);

        return new City(
            number,
            this._centerX + Math.sin(theta)*this._radius,
            this._centerY + Math.cos(theta)*this._radius
        );
    }
}

class RandomCityFactory
{
    constructor(width, height)
    {
        this._width = width;
        this._height = height;
    }

    makeCity(number, totalCities)
    {
        debug.ensure(totalCities > 0, totalCities, "totalCities", "totalCities must be a positive integer");
        debug.ensure(number >= 0 && number < totalCities, number, "number", "number must be between 0 and ${totalCities}");
        
        return new City(
            number,
            Math.random()*this._width,
            Math.random()*this._height
        );
    }
}

function getCityFactory(scaffold, cityPlacement)
{
    var factory = cityPlacement === CityPlacement.CIRCULAR
        ? new CircularCityFactory(scaffold.centerX, scaffold.centerY, scaffold.radius)
        : new RandomCityFactory(scaffold.width, scaffold.height);
    
    return (number, totalCities) => factory.makeCity(number, totalCities);
}

class World
{
    constructor(cityFactory, cityCount)
    {
        debug.ensureNotNull(cityFactory, "cityFactory");
        this._cityCount = debug.ensure(cityCount > 0, cityCount, "cityCount", "cityCount must be more than 0");
        
        this._cities = [];
        for(var i = 0; i < this.cityCount; i++)
        {
            this._cities[i] = cityFactory(i, this.cityCount);
        }
    }

    get cityCount()
    {
        return this._cityCount;
    }

    get cities()
    {
        return this._cities;
    }
}

export {City, World, CircularCityFactory, RandomCityFactory, getCityFactory, CityPlacement};
