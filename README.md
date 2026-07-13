Hey!
This is a fairly straightforward barnes-hut simulation, meaning, instead of calculating the acceleration of each planet using the usual O(n^2) approach where every body pulls on the others, the algorithm recursively collapses space when bodies are close together, limiting the number of bodies involved in calculation and achieving an O(n * log n ) complexity.

A more detailed but still brief explaination of the algorithm is as follows:
Space is divided into octants, and then octants are divided into more octants until a certain depth is achieved. These octants are stored in a tree structure where the root is the whole of space (with arbitrary bounds). Then, for each body in the simulation, you start at the nodes just below the root and check the following condition:

Is the distance between the width of the node divided by the distance between the center of mass of the body below a threshold value (theta; in this case 0.3).

If this is true, you calculate the gravitation effect between the node and body as if the node were a point mass. If not, you check the node's children until you reach max depth. Of course, there are edge cases like when there are no bodies in a node that you need to account for, but that's the gist. Here's a more in-depth wiki on it: 
https://en.wikipedia.org/wiki/Barnes%E2%80%93Hut_simulation

Anway, here are the important engineering decisions:

* Instanced meshing and points: All bodies had to rendered using an instanced mesh; otherwise, the number of draw calls between the CPU and GPU would balloon and preformance would grind to a halt around maybe 2000 bodies. Points were also used in places of isohedrons for small objects like asteroids to reduce rendering time
* Verlet integration: Traditional Euler intergation (dx = v * dt) causes highly unstable orbitals and planets will immediately fly away. I used Verlet integration (dx = x-LastX*dt^2*acceleration) instead to mostly conserve energy. I say mostly because this is an approxmation algorithm, and decay is noticible over long periods
* Webworkers and multithreading: JS is naturally single-threaded, which was very inefficient when physics calculations and rendering are mostly independent. To get around this, I implemented a double duffered structure where, upon simulation start, the webworker would begin doing physics calculations, generate an array of positions, and send it to the main thread. While the main thread was busy rendering, the web worker would begin working on its other array of position, and, by the time it has sent the second array to the main thread, it will have recieved the first array to populate with new positions. Basically, this eliminated physics/rendering bottlenecks, with some side effects
* Custom Octree Logic: Obviously, it was important I implement my own octree because that's the foundation of the project, but, more practically, it wouldn't have worker without one. Since the tree has a depth of about 7 and each level of the tree has 8 times more nodes than the previous, there are over 200k tree nodes being used in each frame. Constantly deleting and recreating the tree would have clogged the browser's Garbage Collection tool, potentially leading to a crash and certainly preformance stalls after 2 seconds. To get around this, I used the same octree for every frame, just changing node attributes.
* Customization of bounds: The simulation has three modes: Chaos (where intializtion is random within bounds), solar system, and solar system with random masses (where every body has a random mass, meaning the sun might have a mass of 1). Getting this to work required a lot of working with DOM elements. 
* Bounds of Octree: The simulation only fully works within (-30000,-30000,-30000) and (30000,30000,3000) because expanding it much beyond this point would require giving the octree more depth, creating a preformance bottleneck. When small bodies exit, they continue to experience gravity, but the rest of the simulation no longer feels their effects, which has no meaningful consequences most of the time.

Here are some bugs:
* When you add 20K bodies or more on the solar system, the sun and planets disappear. Weird, right? It likely has to do with the size of arrays passed between webworkers.
* Energy isn't conserved, which is to be expected because this is an approximation algorithm, but some decay is noticible when the simulation runs for a while. This is forgivable because barnes-hut simulations are usually used to model galaxy collisions.
* When you zoom out, everything dissappears. It reappears if you zoom in. This is because of dynamic sizing, and could be solved with an orthograohic camera, but that makes the normal simulation look strange.
* This isn't exactly a bug, but the orbital patterns aren't realistic because, in order to make them true to reality, the simulation would need to be 99.99% empty space, which isn't a great visual. Also, orbitals are mostly circular because of intial velocity values, but eliptical orbits are very possible if you changed the initial velocities.


Key Preformance Benchmarks:
For context: A simple O(n^2) implementation can handle about 800 bodies smoothly and will crash around 1500 bodies. Some engineering decisions can marginally improve this, but not by much.

Solar System: Can handle 18K bodies, although somewhat laggy. You can push higher to 19k, but weird bugs will begin to happen including the disappearance of the planets and a more sparse Kuiper belt. Can comfortably run in the 6k-10k range. Implementing random masses doesn't seem to affect preformance, but it's reasonable to think that very high masses could make calculations take longer.
Chaos: Has similar preformance metrics, but is generally a little bit slower.

Goals:
I hope to perhaps add collisions to this at a later date, although I am concerned this could cause lag. Most likely, I would use the already created ocrtree to do this.
I might use WebGL to shift calculation to the GPU, which could dramatically improve preformance since the main bottleneck is physics.
