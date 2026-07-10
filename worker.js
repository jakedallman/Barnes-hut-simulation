

const planets = [];
let deltaTime = 0.005;
const G = 1e7;
let sun = null;


class TreeNode{

/// Assigns spatial boundaries to the node

    assignCoordinates(pONe,pTWo){
        this.pOne = pONe;
        this.pTwo = pTWo;
    }



/// used for creating root node

    giftBodies(array){
        this.bodies = array;
        this.divide();
    }

    calculateMass(){
        this.bodies.forEach(body => {
            this.mass += body.mass;
            this.COM[0] += body.mass * body.positions[0];
            this.COM[1] += body.mass * body.positions[1];
            this.COM[2] += body.mass * body.positions[2];
        });
        if (this.mass > 1) {
            this.COM[0] /= this.mass;
            this.COM[1] /= this.mass;
            this.COM[2] /= this.mass;
        }
        for (let i = 0; i < 3; i++) {
            if (isNaN(this.COM[i])) {
                this.COM[i] = 0;
            }
        }
    }
/// Clears all the node's data unless it's the root
/// Recursively clears all children too

    clear(){

        this.bodies = [];

        this.mass = 0;
        this.COM = [0,0,0];
        this.children.forEach(child => {
            child.clear();
        });
    }

/// Divides the node's space and planets into 8 octants

    divide(){
        this.calculateMass();
        if (this.bodies.length === 0 || this.depth > 5) return;
        const midpoint = [
            (this.pOne[0] + this.pTwo[0]) / 2,
            (this.pOne[1] + this.pTwo[1]) / 2,
            (this.pOne[2] + this.pTwo[2]) / 2
        ];
        
        for (let body of this.bodies) {
            const pos = body.positions;
            let octant = 0;

            if (pos[0] >= midpoint[0]) octant += 1;
            if (pos[1] >= midpoint[1]) octant += 2;
            if (pos[2] >= midpoint[2]) octant += 4;

            this.children[octant].bodies.push(body);
        }
        this.children[0].assignCoordinates(this.pOne, midpoint);
        this.children[1].assignCoordinates([midpoint[0], this.pOne[1], this.pOne[2]], [this.pTwo[0], midpoint[1], midpoint[2]]);
        this.children[2].assignCoordinates([this.pOne[0], midpoint[1], this.pOne[2]], [midpoint[0], this.pTwo[1], midpoint[2]]);
        this.children[3].assignCoordinates([midpoint[0], midpoint[1], this.pOne[2]], [this.pTwo[0], this.pTwo[1], midpoint[2]]);
        this.children[4].assignCoordinates([this.pOne[0], this.pOne[1], midpoint[2]], [midpoint[0], midpoint[1], this.pTwo[2]]);
        this.children[5].assignCoordinates([midpoint[0], this.pOne[1], midpoint[2]], [this.pTwo[0], midpoint[1], this.pTwo[2]]);
        this.children[6].assignCoordinates([this.pOne[0], midpoint[1], midpoint[2]], [midpoint[0], this.pTwo[1], this.pTwo[2]]);
        this.children[7].assignCoordinates(midpoint, this.pTwo);
        this.children[0].divide();
        this.children[1].divide();
        this.children[2].divide();
        this.children[3].divide();
        this.children[4].divide();
        this.children[5].divide();
        this.children[6].divide();
        this.children[7].divide();
    
    }

    addForce(body){
        let gap = Math.hypot(body.positions[0]-this.COM[0], body.positions[1]-this.COM[1], body.positions[2]-this.COM[2]);
        if (this.mass > 0 && gap > 100) {
            if (this.bodies.length < 2 ||(this.pTwo[0] - this.pOne[0]) / gap < 0.3 || this.children.length === 0) {
                const factor = (G * this.mass) / (gap * gap * gap);
                body.accelerationX -= factor * (body.positions[0] - this.COM[0]);
                body.accelerationY -= factor * (body.positions[1] - this.COM[1]);
                body.accelerationZ -= factor * (body.positions[2] - this.COM[2]);
            
            }
            else {
                this.children[0].addForce(body);
                this.children[1].addForce(body);
                this.children[2].addForce(body);
                this.children[3].addForce(body);
                this.children[4].addForce(body);
                this.children[5].addForce(body);
                this.children[6].addForce(body);
                this.children[7].addForce(body);
            }
         }
        
    }



/// general tree node constructor; two points are boundaries for space and bodies are planets
/// while children are the 8 octants of space that the node divides into

    constructor(depth){
        this.pOne = [];
        this.pTwo = [];
        this.bodies = [];
        this.children = [];
        this.mass = 0;
        this.depth = depth
        this.COM = [0,0,0];
        if (depth < 6){
            for (let i = 0; i < 8; i++){
                this.children.push(new TreeNode(depth+1));
            }
        }
    }
        
    
} 


let count = 0;


let temp = [0,0,0];


class Planet {
    constructor(name, radius,x,y,z, vx,vy,vz, color, mass){
        this.name = name;
        if (name === 'Sun') {
            sun = this;
        }
        this.radius = radius*10;
        this.positionsLast = [x - vx * deltaTime, y - vy * deltaTime, z - vz * deltaTime];
        this.positions = [x, y, z];
        this.color = color;
        this.mass = mass;
        this.index = count;
        this.accelerationX=0;
        this.accelerationY=0;
        this.accelerationZ=0;


        count++;
        planets.push(this);
    }

    gravityUpdates(){
        
        treeRoot.addForce(this);

        // Apply velocity to update position
        temp[0] = this.positions[0];
        temp[1] = this.positions[1];
        temp[2] = this.positions[2];
        this.positions[0] = 2*this.positions[0] - this.positionsLast[0]+deltaTime*deltaTime*this.accelerationX;
        this.positions[1] = 2*this.positions[1] - this.positionsLast[1]+deltaTime*deltaTime*this.accelerationY;
        this.positions[2] = 2*this.positions[2] - this.positionsLast[2]+deltaTime*deltaTime*this.accelerationZ;
        this.positionsLast[0] = temp[0];
        this.positionsLast[1] = temp[1];
        this.positionsLast[2] = temp[2];

        this.accelerationX = 0;
        this.accelerationY = 0;
        this.accelerationZ = 0;


    }
    isAsteroid(){
        return false;
    }
}

count = 0;



///sister class for planets; uses point rendering instead of mesh rendering





class asteroid {
    constructor(name, radius,x,y,z, vx,vy,vz, color, mass){
        this.name = name;
        this.radius = radius*10;
        this.positionsLast = [x - vx * deltaTime, y - vy * deltaTime, z - vz * deltaTime];
        this.positions = [x, y, z];
        this.color = color;
        this.mass = mass;
        this.index = count;
        this.accelerationX=0;
        this.accelerationY=0;
        this.accelerationZ=0;

        count++;

    }

    

    gravityUpdates(){
        
        treeRoot.addForce(this);

        // Apply velocity to update position
        temp[0] = this.positions[0];
        temp[1] = this.positions[1];
        temp[2] = this.positions[2];
        this.positions[0] = 2*this.positions[0] - this.positionsLast[0]+deltaTime*deltaTime*this.accelerationX;
        this.positions[1] = 2*this.positions[1] - this.positionsLast[1]+deltaTime*deltaTime*this.accelerationY;
        this.positions[2] = 2*this.positions[2] - this.positionsLast[2]+deltaTime*deltaTime*this.accelerationZ;


        this.positionsLast[0] = temp[0];
        this.positionsLast[1] = temp[1];
        this.positionsLast[2] = temp[2];

        this.accelerationX=0;
        this.accelerationY=0;
        this.accelerationZ=0;
    }
    isAsteroid(){
        return true;
    }

}


function computeArray(array)
{
    let serializedCount = 0;
    for (let i = 0; i < planets.length; i++)
    {
        const body = planets[i];
        const base = serializedCount * 4;
        array[base] = body.positions[0];
        array[base + 1] = body.positions[1];
        array[base + 2] = body.positions[2];
        array[base + 3] = body.isAsteroid() ? -1 : body.radius;
        serializedCount++;
    }
    return serializedCount;
}

const orbitalVelocity = (x, y, z) => {
    const distance = Math.hypot(x, y, z);
    if (distance === 0) return [0, 0, 0];
    const speed = Math.sqrt((G * 100000) / distance);
    const tangent = [-z, 0, x];
    const tangentMag = Math.hypot(tangent[0], tangent[1], tangent[2]);
    if (tangentMag === 0) return [0, 0, 0];
    return [tangent[0] / tangentMag * speed, 0, tangent[2] / tangentMag * speed];
};

function initializeSimulation({ selectedMode, asteroids = 0, iceBodies = 0, randomMasses = false, massMin = 1, massMax = 100,
        Xmin,
        XMax,
        Ymin,
        YMax,
        Zmin,
        ZMax,
        XvelMin,
        XvelMax,
        YvelMin,
        YvelMax,
        ZvelMin,
        ZvelMax,
        chaosMinimumMass,
        chaosMaximumMass,
        chaosNumberBodies }) {
    planets.length = 0;
    count = 0;
    sun = null;
    if (selectedMode === 'chaos') {
        for (let i = 0; i < chaosNumberBodies; i++){
            planets.push(new asteroid('Body_${i}', 1, (Math.random()*(XMax-Xmin)+Xmin), (Math.random()*(YMax-Ymin)+Ymin), (Math.random()*(ZMax-Zmin)+Zmin), (Math.random()*(XvelMax-XvelMin)+XvelMin), (Math.random()*(YvelMax-YvelMin)+YvelMin), (Math.random()*(ZvelMax-ZvelMin)+ZvelMin), 0x888888 + Math.floor(Math.random() * 0x111111), (Math.random()*(chaosMaximumMass-chaosMinimumMass)+chaosMinimumMass)));
        }
    }
    else if (randomMasses){
        new Planet('Sun', 8, 0, 0, 0, 0, 0, 0, 0xffff00, massMin + Math.random() * (massMax - massMin));
        new Planet('Mercury', 1.2, 1100, 0, 0, ...orbitalVelocity(1100, 0, 0), 0xaaaaaa, massMin + Math.random() * (massMax - massMin));
        new Planet('Venus', 1.8, 1400, 0, 0, ...orbitalVelocity(1400, 0, 0), 0xffcc00, massMin + Math.random() * (massMax - massMin));
        new Planet('Earth', 2.0, -2400, 0, 0, ...orbitalVelocity(-2400, 0, 0), 0x0000ff, massMin + Math.random() * (massMax - massMin));
        new Planet('Mars', 1.3, 3200, 0, 0, ...orbitalVelocity(3200, 0, 0), 0xff0000, massMin + Math.random() * (massMax - massMin));
        new Planet('Jupiter', 3.5, 5600, 0, 0, ...orbitalVelocity(5600, 0, 0), 0xff8800, massMin + Math.random() * (massMax - massMin));
        new Planet('Saturn', 3.0, 7800, 0, 0, ...orbitalVelocity(7800, 0, 0), 0xffff88, massMin + Math.random() * (massMax - massMin));
        new Planet('Uranus', 2.4, -11000, 0, 0, ...orbitalVelocity(-11000, 0, 0), 0x88ffff, massMin + Math.random() * (massMax - massMin));
        new Planet('Neptune', 2.3, 14000, 0, 0, ...orbitalVelocity(14000, 0, 0), 0x000088, massMin + Math.random() * (massMax - massMin));

        for (let i = 0; i < asteroids; i++) {
            const orbitRadius = 3800 + Math.random() * 2000;
            const angle = Math.random() * Math.PI * 2;
            const verticalOffset = (Math.random() - 0.5) * 500;
            const x = Math.cos(angle) * orbitRadius;
            const z = Math.sin(angle) * orbitRadius;
            const asteroidSize = 0.1 + Math.random() * 0.3;
            planets.push(new asteroid(`Asteroid_${i}`, asteroidSize, x, verticalOffset, z, ...orbitalVelocity(x, verticalOffset, z), 0x888888 + Math.floor(Math.random() * 0x111111), massMin + Math.random() * (massMax - massMin)));
        }

        for (let i = 0; i < iceBodies; i++) {
            const orbitRadius = 18000 + Math.random() * 4000;
            const angle = Math.random() * Math.PI * 2;
            const verticalOffset = (Math.random() - 0.5) * 1000;
            const x = Math.cos(angle) * orbitRadius;
            const z = Math.sin(angle) * orbitRadius;
            const asteroidSize = 0.08 + Math.random() * 0.25;
            planets.push(new asteroid(`IceBody_${i}`, asteroidSize, x, verticalOffset, z, ...orbitalVelocity(x, verticalOffset, z), 0x6699ff + Math.floor(Math.random() * 0x330000), massMin + Math.random() * (massMax - massMin)));
        }
    } else{
        new Planet('Sun', 8, 0, 0, 0, 0, 0, 0, 0xffff00, 100000);
        new Planet('Mercury', 1.2, 1100, 0, 0, ...orbitalVelocity(1100, 0, 0), 0xaaaaaa, 100);
        new Planet('Venus', 1.8, 1400, 0, 0, ...orbitalVelocity(1400, 0, 0), 0xffcc00, 100);
        new Planet('Earth', 2.0, -2400, 0, 0, ...orbitalVelocity(-2400, 0, 0), 0x0000ff, 100);
        new Planet('Mars', 1.3, 3200, 0, 0, ...orbitalVelocity(3200, 0, 0), 0xff0000, 100);
        new Planet('Jupiter', 3.5, 5600, 0, 0, ...orbitalVelocity(5600, 0, 0), 0xff8800, 100);
        new Planet('Saturn', 3.0, 7800, 0, 0, ...orbitalVelocity(7800, 0, 0), 0xffff88, 100);
        new Planet('Uranus', 2.4, -11000, 0, 0, ...orbitalVelocity(-11000, 0, 0), 0x88ffff, 100);
        new Planet('Neptune', 2.3, 14000, 0, 0, ...orbitalVelocity(14000, 0, 0), 0x000088, 100);

        for (let i = 0; i < asteroids; i++) {
            const orbitRadius = 3800 + Math.random() * 2000;
            const angle = Math.random() * Math.PI * 2;
            const verticalOffset = (Math.random() - 0.5) * 500;
            const x = Math.cos(angle) * orbitRadius;
            const z = Math.sin(angle) * orbitRadius;
            const asteroidSize = 0.1 + Math.random() * 0.3;
            planets.push(new asteroid(`Asteroid_${i}`, asteroidSize, x, verticalOffset, z, ...orbitalVelocity(x, verticalOffset, z), 0x888888 + Math.floor(Math.random() * 0x111111), 5));
        }

        for (let i = 0; i < iceBodies; i++) {
            const orbitRadius = 18000 + Math.random() * 4000;
            const angle = Math.random() * Math.PI * 2;
            const verticalOffset = (Math.random() - 0.5) * 1000;
            const x = Math.cos(angle) * orbitRadius;
            const z = Math.sin(angle) * orbitRadius;
            const asteroidSize = 0.08 + Math.random() * 0.25;
            planets.push(new asteroid(`IceBody_${i}`, asteroidSize, x, verticalOffset, z, ...orbitalVelocity(x, verticalOffset, z), 0x6699ff + Math.floor(Math.random() * 0x330000), 5));
        }
    }

};








///create tree node

const treeRoot = new TreeNode(0);
treeRoot.assignCoordinates([-30000, -30000, -30000], [30000, 30000, 30000]);   

let freeBuffers = [];

function sendFrame(buffer) {
    treeRoot.giftBodies(planets);
    planets.forEach(planet => {
        planet.gravityUpdates();
    });
    treeRoot.clear();

    const bodyCount = computeArray(new Float32Array(buffer));
    self.postMessage({ type: 'frame', buffer, bodyCount }, [buffer]);
}

self.onmessage = function(event) {
    const data = event.data;
    if (data.type === 'start') {
        freeBuffers = data.buffers.slice();
        if (freeBuffers.length > 0) {
            sendFrame(freeBuffers.shift());
        }
    } else if (data.type === 'configure') {
        initializeSimulation(data);
        if (freeBuffers.length > 0) {
            sendFrame(freeBuffers.shift());
        }
    } else if (data.type === 'returnBuffer') {
        freeBuffers.push(data.buffer);
        if (freeBuffers.length > 0) {
            sendFrame(freeBuffers.shift());
        }
    }
};
