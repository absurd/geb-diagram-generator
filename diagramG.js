            function Circle(centerX, centerY, radius, num) {
                this.x = centerX;
                this.y = centerY;
                this.radius = radius;
                this.num = num;
                this.draw = function (canvas) {
                    /*if ((this.x - this.radius <= 0) || (this.x + this.radius >= canvas.width)
                        || (this.y - this.radius <= 0) || (this.y + this.radius >= canvas.height)) {
                            // I done gone and disabled the outbounds draw error in preparation for zooming
                            // alert("Outbounds Draw Error");
                    } else {*/
                        var context = canvas.getContext("2d");;
                        context.beginPath();
                        context.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
                        context.strokeStyle = "black";;
                        context.lineWidth = 2;
                        context.fillStyle = "white"; // fill in circles to cover join line
                        context.fill()
                        context.stroke();
                        if (this.num) {
                            context.textBaseline = "middle";
                            context.textAlign = "center";
                            context.fillStyle = "black";
                            context.fillText(String(num), this.x, this.y,2*(this.radius - context.lineWidth));
                        }
                    //}
                }
            }            
            function lineJoin(circ1,circ2,canvas) {
                var ljContext = canvas.getContext("2d");
                ljContext.beginPath();
                ljContext.moveTo(circ1.x,circ1.y);
                ljContext.lineTo(circ2.x,circ1.y);
                ljContext.lineTo(circ2.x,circ2.y);
                ljContext.lineWidth = 2;
                ljContext.strokeStyle = "#1a1a1a";
                ljContext.stroke();
            }

            function Node(selfNumber, parentNumber, birthOrder, generation, canvas) {
                this.num = selfNumber;
                this.parentNum = parentNumber;
                this.birthOrder = birthOrder;
                this.generation = generation;
                this.childCount = 0;
                this.domainWidth = canvas.width - 40; // provisional value
                this.xOffset = 20; // 40px margin to keep circles from getting cut off
                this.setDomainWidth = function (par) {
                    this.domainWidth = par.domainWidth / par.childCount;
                    this.xOffset = par.xOffset + this.domainWidth * (this.birthOrder - 1);
                }
                this.makeCircle = function(ySep) {
                    this.circle = new Circle(Math.floor(this.domainWidth / 2 + this.xOffset), 
                                             Math.floor(canvas.height - (ySep * this.generation)), 
                                             10, // radius 
                                             this.num);
                }
                //Fixed: Bug - domainWidth inheritance isn't enough, the offsets have to be passed to children also.    
                this.drawLines = function (par) {
                    lineJoin(par.circle, this.circle, canvas);
                }
                this.drawCircle = function () {
                    this.circle.draw(canvas);
                }
            }

            function diagramGenerator(func, maxGenerations, canvas, dgCache) {
                var nullNode = new Node(0,0,0,0,canvas);
                var ySeparation = canvas.height / (maxGenerations + 1);
                if (dgCache) {
                    var allNodes = dgCache.allNodes;
                    var genCount = dgCache.genCount;
                    var nodeCount = dgCache.nodeCount;
                    var processedGens = dgCache.processedGens;
                } else {
                    var allNodes = {};
                    var genCount = 1;
                    var nodeCount = 1;
                    var processedGens = 0;
                    // initialize
                    allNodes[nodeCount] = new Node(nodeCount, nodeCount, 1, 1, canvas); // its own parent, but not its own child ;)
                    nodeCount = nodeCount + 1;
                }
                // Phase 1: Generate Nodes until maxGeneration limit is reached
                while (genCount <= maxGenerations) {
                    //console.log("Calculated: nodeCount = " + nodeCount + ", genCount = " + genCount);
                    var currentParent = func(nodeCount);        // Here's the actual evaluation of the function
                    //var parentGeneration = (allNodes[currentParent]) ? allNodes[currentParent].generation : 0;
                    if (allNodes[currentParent] == undefined) {  // Half-thought out kludge directed at function F :/
                        allNodes[currentParent] = nullNode;
                    } 
                    if (allNodes[currentParent].generation != maxGenerations) { // function G type functions always point backwards to existing nodes
                        allNodes[nodeCount] = new Node(nodeCount, currentParent,
                                                       allNodes[currentParent].childCount + 1,
                                                       allNodes[currentParent].generation + 1,
                                                       canvas);
                        allNodes[currentParent].childCount = allNodes[currentParent].childCount + 1;
                        genCount = (genCount < allNodes[nodeCount].generation) ? allNodes[nodeCount].generation : genCount;
                        nodeCount = nodeCount + 1;
                    } else { 
                        genCount = genCount + 1; }
                }
                // Phase 2: Calculate domainWidths based on final #'s of children per parent
                canvas.width = canvas.width; // erase canvas
                for (n in allNodes) {
                    thisNode = allNodes[n];
                    if (thisNode.generation <= maxGenerations) {
                        if (thisNode.generation > processedGens) {
                            allNodes[n].setDomainWidth(allNodes[thisNode.parentNum]); // pass parent Node obj to setDomainWidth
                        }
                        allNodes[n].makeCircle(ySeparation);
                        allNodes[n].drawLines(allNodes[thisNode.parentNum]);
                        //allNodes[n].drawCircle();
                    }
                }
                /*
                // Phase 3: Generate a Circle object for each Node
                for (n in allNodes) {
                    if (allNodes[n].generation <= maxGenerations) {
                        allNodes[n].makeCircle(ySeparation);
                    }
                } 
                // Phase 4: Draw
                canvas.width = canvas.width; // erase canvas
                for (n in allNodes) {
                    if (allNodes[n].generation <= maxGenerations) {
                        allNodes[n].drawLines(allNodes[allNodes[n].parentNum]);
                    }
                }*/
                for (n in allNodes) {
                    if (allNodes[n].generation <= maxGenerations) {
                        allNodes[n].drawCircle();
                    }
                }
                
                dgCache = new Object;
                dgCache.allNodes = allNodes;
                dgCache.genCount = genCount;
                dgCache.nodeCount = nodeCount;
                dgCache.processedGens = (processedGens < maxGenerations) ? maxGenerations : processedGens;
                //console.log("Max Node Count: " + nodeCount);
                return dgCache;
            }
