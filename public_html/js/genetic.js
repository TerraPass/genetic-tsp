import * as debug from 'js/debug.js';

var SelectionType = Object.freeze({
    ROULETTE    : 0,
    TOURNAMENT  : 1,
    SUS         : 2,    // Stochastic Universal Sampling
    STEADY      : 3    // Steady State Selection
    // etc.
});

var CrossoverType = Object.freeze({
    PMX : 0,    // Partially Matched Crossover
    CX  : 1,    // Cycle Crossover
    OBX : 2,    // Order Based Crossover
    PBX : 3     // Position Based Crossover
    // etc.
});

var MutationType = Object.freeze({
    NONE        : 0,
    EXCHANGE    : 1,
    SCRAMBLE    : 2,
    DM          : 3,    // Displacement Mutation
    INSERTION   : 4,
    INVERSION   : 5,
    DIVM        : 6    // Displacement Inversion Mutation
    // etc.
});

var ScalingType = Object.freeze({
    NONE        : 0,
    RANK        : 1,
    SIGMA       : 2,
    BOLTZMAN    : 3
    // etc.
});

class GeneticAlgorithm
{
    constructor(impl, populationSize, crossoverRate, mutationRate, eliteCount, eliteCopies)
    {
        debug.ensure(populationSize >= eliteCount*eliteCopies, populationSize, "populationSize", "The following must hold true: populationSize >= eliteCount*eliteCopies");
        
        this._impl = impl;
        this._populationSize = populationSize;
        this._crossoverRate = crossoverRate;
        this._mutationRate = mutationRate;
        this._eliteCount = eliteCount;
        this._eliteCopies = eliteCopies;
        
        this._totalElites = this._eliteCount*this._eliteCopies;
        
        this._generation = -1;

        this._population = [];
        for(var i = 0; i < this.populationSize; i++)
        {
            this._population[i] = this._impl.generateGenome();
        }
        this._impl.population = this._population;

        this._allTimeBestFitness = -Infinity;
        this._allTimeBestGenome = null;
        this._allTimeBestGeneration = -1;
        
        this._populationStats = null;
        
        this.epoch();  // Prime the algorithm
    }

    epoch()
    {
        // If this is not a priming run
        if(this._generation >= 0)
        {
            var newPopulation = [];

            // Carry over elites from the previous generation
            for(var i = 0; i < this._eliteCount; i++)
            {
                for(var j = 0; j < this._eliteCopies; j++)
                {
                    newPopulation.push(this._populationStats[i].genome);
                }
            }

            var totalFitness = this._populationStats.reduce((soFar, stat) => soFar + stat.fitness, 0);

            // Fill the rest with "children" of the old genomes
            for(var i = this._totalElites; i < this._populationSize; i++)
            {
                var parent0 = this._impl.selectGenome(this._populationStats, totalFitness);
                var parent1 = this._impl.selectGenome(this._populationStats, totalFitness);
                
                // TODO: Force parents to be different?
                
                newPopulation[i] = this._maybeMutate(this._maybeCrossover(parent0, parent1));
            }

            this._population = newPopulation;
            this._impl.population = newPopulation;
        }
        
        this._generation++;
        
        // Population stats, sorted from best to worst fitness-wise
        this._populationStats = this._population.map(
            (g) => ({
                genome : g,
                fitness : this._impl.fitness(g)
            })
        ).sort((stat0, stat1) => stat1.fitness - stat0.fitness);

        // Update current best, median and worst stats
        this._bestStat = this._populationStats[0];
        this._medianStat = this._populationStats[Math.floor(this._populationSize/2)];
        this._worstStat = this._populationStats[this._populationSize-1];

        // Keep track of the all-time best genome
        if(this._bestStat.fitness > this._allTimeBestFitness)
        {
            this._allTimeBestFitness = this._bestStat.fitness;
            this._allTimeBestGenome = this._bestStat.genome;
            this._allTimeBestGeneration = this._generation;
        }
    }
    
    _maybeCrossover(parent0, parent1)
    {
        if(Math.random() < this._crossoverRate)
        {
            return this._impl.crossover(parent0, parent1);
        }
        else
        {
            return parent0;
        }
    }
    
    _maybeMutate(genome)
    {
        if(Math.random() < this._mutationRate)
        {
            return this._impl.mutate(genome);
        }
        else
        {
            return genome;
        }
    }

    get population()
    {
        return this._population;
    }

    get populationSize()
    {
        return this._populationSize;
    }
    
    get crossoverRate()
    {
        return this._crossoverRate;
    }
    
    get mutationRate()
    {
        return this._mutationRate;
    }

    get currentState()
    {
        return {
            allTimeBestFitness : this._allTimeBestFitness,
            allTimeBestGenome : this._allTimeBestGenome,
            allTimeBestGeneration : this._allTimeBestGeneration,
            
            generation : this._generation,

            bestGenome : this._bestStat.genome,
            medianGenome : this._medianStat.genome,
            worstGenome : this._worstStat.genome,
            
            bestFitness : this._bestStat.fitness,
            medianFitness : this._medianStat.fitness,
            worstFitness : this._worstStat.fitness
        };
    }

    get allTimeBestFitness()
    {
        return this._allTimeBestFitness;
    }
    
    get allTimeBestGenome()
    {
        return this._allTimeBestGenome;
    }

    get allTimeBestGeneration()
    {
        return this._allTimeBestGeneration;
    }
    
    get generation()
    {
        return this._generation;
    }
}

class Genome
{
    constructor(cities, sequence)
    {
        this._sequence = sequence;
        this._distance = Genome._calculateTotalDistance(cities, this._sequence);
    }

    get sequence()
    {
        return this._sequence;
    }

    get distance()
    {
        return this._distance;
    }

    static _calculateTotalDistance(cities, sequence)
    {
        debug.ensure(
            cities.length === sequence.length, 
            sequence, 
            "sequence", 
            "Lengths of cities and sequence arrays must match, got "+cities.length+" and "+sequence.length
        );

        // If there is only 1 city, any route will have length 0
        if(sequence.length === 1)
        {
            return 0;
        }

        // Include return distance from the last city to the first
        var result = Genome._calculateDistance(cities[sequence[sequence.length-1]], cities[0]);
        for(var i = 1; i < sequence.length; i++)
        {
            result += Genome._calculateDistance(cities[sequence[i-1]], cities[sequence[i]]);
        }
        return result;
    }
    
    static _calculateDistance(city0, city1)
    {
        var diffX = city1.x - city0.x;
        var diffY = city1.y - city0.y;
        return Math.sqrt(diffX*diffX + diffY*diffY);
    }
}

class BasicTSPGeneticAlgorithmImpl
{
    constructor(cities)
    {
        this._cities = cities;
        this._orderedSequence = [];
        for(var i = 0; i < this._cities.length; i++)
        {
            this._orderedSequence.push(i);
        }

        this._population = null;
        this._worstDistance = Infinity;
    }

    set population(value)
    {
        this._population = value;
        this._worstDistance = this._population.reduce(
            (soFar, genome) => genome.distance > soFar ? genome.distance : soFar,
            -Infinity
        );
    }

    generateGenome()
    {
        return new Genome(this._cities, BasicTSPGeneticAlgorithmImpl._shuffle(this._orderedSequence.slice()));
    }
    
    fitness(genome)
    {
        return this._worstDistance - genome.distance;
    }
    
    // Roulette wheel selection
    selectGenome(populationStats, totalFitness)
    {
        var wheelPosition = Math.random()*totalFitness;
        var currentSum = 0;
        var i = 0;
        for(; i < populationStats.length; i++)
        {
            currentSum += populationStats[i].fitness;
            if(currentSum > wheelPosition)
            {
                return populationStats[i].genome;
            }
        }
        return populationStats[populationStats.length - 1].genome;
        
    }
    
    // Partially Matched Crossover
    crossover(parent0, parent1)
    {
        debug.ensure(parent0.sequence.length === parent1.sequence.length, parent1, "parent1", "Lengths of both parent sequences must match");

        var length = parent0.sequence.length;

        // If there are less than 2 cities, there is only one possible permutation anyway.
        if(length < 2)
        {
            return parent0;
        }

        var start = Math.floor(Math.random()*(length - 2));
        var end = start + 1 + Math.floor(Math.random()*(length - 1 - start));

//        var mapping = new Array(length);
//        for(var i = start; i < end+1; i++)
//        {
//            mapping[parent0.sequence[i]] = parent1.sequence[i];
//            mapping[parent1.sequence[i]] = parent0.sequence[i];
//        }

// TODO: Modify this function and the calling code, so that several (2 in this case)
// children could be produced at once.
//        return new Genome(this._cities, parent0.sequence.slice().map((el) => mapping[el] !== undefined ? mapping[el] : el));

        // TODO: Verify that the below implementation of PMX is correct!!
        var childSequence = parent0.sequence.slice();
        for(var i = start; i < end+1; i++)
        {
            var lhs = parent0.sequence[i];
            var rhs = parent1.sequence[i];

            childSequence = childSequence.map((el) => el === lhs ? rhs : (el === rhs ? lhs : el));
        }

        return new Genome(this._cities, childSequence);
    }
    
    // Exchange mutation operator
    mutate(genome)
    {
        var length = genome.sequence.length;

        var index0 = Math.floor(Math.random()*length);
        var index1 = index0;
        
        while(index0 === index1)
        {
            index1 = Math.floor(Math.random()*length);
        }

        var mutatedSequence = [];
        for(var i = 0; i < length; i++)
        {
            if(i === index0)
            {
                mutatedSequence[i] = genome.sequence[index1];
            }
            else if(i === index1)
            {
                mutatedSequence[i] = genome.sequence[index0];
            }
            else
            {
                mutatedSequence[i] = genome.sequence[i];
            }
        }
        return new Genome(this._cities, mutatedSequence);
    }

    // Fisher-Yates algorithm, taken from
    // https://stackoverflow.com/a/6274398
    static _shuffle(array) {
        let counter = array.length;

        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            let index = Math.floor(Math.random() * counter);

            // Decrease counter by 1
            counter--;

            // And swap the last element with it
            let temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }

        return array;
    }
}

export {
    SelectionType,
    CrossoverType,
    MutationType,
    ScalingType,
    
    GeneticAlgorithm,
    
    BasicTSPGeneticAlgorithmImpl
};
