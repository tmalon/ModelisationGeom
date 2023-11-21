init()
animate()


function new_image(src) {
    img = new Image()
    img.src = src
    return img
}


function getMousePos(c, event) {
    var rect = c.getBoundingClientRect()
    return {
        x: (event.clientX - rect.left)/zoom,
        y: (event.clientY - rect.top)/zoom
    }
}


function reportWindowSize() {

    canvas.style.transformOrigin = 'top left'
    zoom = window.innerHeight / 1080
    canvas.style.transform="scale(" + zoom + "," + zoom + ")"

}


// Fonctions utiles pour splines
function riesenfeld(i, m, t) {

    let sum = 0

    for (let k = 0; k <= m-i; k++) {
        sum += (-1)**k * (t+m-i-k)**m / (facto(k)*facto(m-k+1))
    }

    return (m+1) * sum

}


function spline(P, m, t) {

    if (t < 0) {
        return P[0]
    } else if (t > 1) {
        return P[P.length-1]
    }

    let x = 0
    let y = 0
    let n = P.length

    for (let i = 0; i < n; i++) {
        let r = riesenfeld(i, m, t)
        x += P[i].x * r
        y += P[i].y * r
    }

    return {"x": x, "y": y}

}


// Fonctions utiles pour Bézier
function facto(n) {
    if (n <= 1) {
        return 1
    } else {
        return n*facto(n-1)
    }
}


function k_parmi_n(k, n) {
    return facto(n) / (facto(k) * facto(n-k))
}


function bernstein(i, m, u) {
    return k_parmi_n(i, m)*(u**i)*( (1-u)**(m-i) )
}


function bezier(P, t) {

    if (t < 0) {
        return P[0]
    } else if (t > 1) {
        return P[P.length-1]
    }

    let x = 0
    let y = 0
    let n = P.length

    for (let i = 0; i < n; i++) {
        let b = bernstein(i, n-1, t)
        x += P[i].x * b
        y += P[i].y * b
    }

    return {"x": x, "y": y}

}

function init() {

    zoom = 1

    m = 2

    canvas = document.getElementById("canvasJeu")
    ctx = canvas.getContext("2d")
    ctx.font = "72px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "#ffffff"

    window.addEventListener('resize', reportWindowSize)

    window.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    }, false)

    reportWindowSize()

    xyMouseMove = {"x": -1, "y": -1}
    xyMouseDown = {"x": -1, "y": -1}
    xyMouseUp   = {"x": -1, "y": -1}

    pts = []

    mode = 1
    mode_t = 0

    clicked = {"down": false, "up": false, "right": false, "idx_pt": -1}
    modes = ["Lagrange", "Bezier", "B-Spline unif"]

    canvas.addEventListener("mousemove", function(event) {
        xyMouseMove = getMousePos(canvas, event)
    }, false)

    canvas.addEventListener("mousedown", function(event) {
        xyMouseDown = getMousePos(canvas, event)
        clicked.down = true
        clicked.right = (event.which == 3)
    }, false)

    canvas.addEventListener("mouseup", function(event) {
        xyMouseUp = getMousePos(canvas, event)
        clicked.up = true
    }, false)

}



function animate() {

    ///////////////////////////////////////////////////////////
    // TRAITEMENTS
    ///////////////////////////////////////////////////////////
    if (xyMouseMove.y > 180) {

        if (clicked.down) {
            clicked.down = false
            let found = false
            for (let i = 0; i < pts.length && !found; i++) {
                if ( (pts[i].x - xyMouseDown.x)**2 + (pts[i].y - xyMouseDown.y)**2 < 625) {
                    if (clicked.right) {
                        pts.splice(i, 1)
                        i--
                    } else {
                        clicked.idx_pt = i
                    }
                    found = true
                }
            }

            if (!found && !clicked.right) {
                pts.push({"x": xyMouseDown.x, "y": xyMouseDown.y})
            }
        }

        if (clicked.idx_pt >= 0) {
            pts[clicked.idx_pt].x = xyMouseMove.x
            pts[clicked.idx_pt].y = xyMouseMove.y
        }

        if (clicked.up) {
            clicked.up = false
            clicked.idx_pt = -1
        }
    } else {
        if (clicked.down) {
            clicked.down = false
            for (let i = 0; i < modes.length; i++) {
                if (xyMouseDown.x > 10 + 480*i && xyMouseDown.x < 470+480*i && xyMouseDown.y > 10 && xyMouseDown.y < 110) {
                    mode = i
                }
            }

            if ((xyMouseDown.x-1310)**2 + (xyMouseDown.y - 160)**2 < 900) {
                m = Math.min(m+1, 10)
            } else if ((xyMouseDown.x-1390)**2 + (xyMouseDown.y - 160)**2 < 900) {
                m = Math.max(m-1, 1)
            } else if ((xyMouseDown.x < 480) && xyMouseDown.y > 120 && xyMouseDown.y < 155) {
                mode_t = 0
            } else if ((xyMouseDown.x < 480) && xyMouseDown.y > 155 && xyMouseDown.y < 190) {
                mode_t = 1
            }
        }
    }

    ///////////////////////////////////////////////////////////
    // AFFICHAGE
    ///////////////////////////////////////////////////////////
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < modes.length; i++) {
        ctx.beginPath()
        ctx.moveTo(10+480*i, 10)
        ctx.lineTo(470+480*i, 10)
        ctx.lineTo(470+480*i, 110)
        ctx.lineTo(10+480*i, 110)
        ctx.lineTo(10+480*i, 10)
        ctx.lineWidth = 4
        ctx.fillStyle = "#111111"
        ctx.strokeStyle = "#000000"
        ctx.fill()
        ctx.stroke()
        ctx.lineWidth = 1
        if (mode == i) {
            ctx.fillStyle = "#ff0000"
        } else {
            ctx.fillStyle = "#ffffff"
        }
        ctx.strokeText(modes[i], 240+480*i, 60)
        ctx.fillText(modes[i], 240+480*i, 60)
        ctx.fillStyle = "#ffffff"
    }

    ctx.fillStyle = "#ffffff"
    ctx.strokeText("degré " + m, 1130, 160)
    ctx.fillText("degré " + m, 1130, 160)
    ctx.strokeText("+", 1310, 160)
    ctx.fillText("+", 1310, 160)
    ctx.strokeText("−", 1390, 160)
    ctx.fillText("−", 1390, 160)

    ctx.font = "30px Arial"
    ctx.strokeText("Clic droit : placer un point", 1680, 40)
    ctx.fillText("Clic droit : placer un point", 1680, 40)
    ctx.strokeText("Clic gauche : retirer un point", 1680, 80)
    ctx.fillText("Clic gauche : retirer un point", 1680, 80)

    if (mode_t == 0) {
        ctx.fillStyle = "#ff0000"
    } else {
        ctx.fillStyle = "#ffffff"
    }
    ctx.strokeText("Paramétrisation uniforme", 240, 130)
    ctx.fillText("Paramétrisation uniforme", 240, 130)

    if (mode_t == 1) {
        ctx.fillStyle = "#ff0000"
    } else {
        ctx.fillStyle = "#ffffff"
    }
    ctx.strokeText("Param abscisses Chebychev", 240, 165)
    ctx.fillText("Param abscisses Chebychev", 240, 165)
    ctx.font = "72px Arial"

    ctx.fillStyle = "#ffffff"

    for (let pt of pts) {
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 10, 0, 2*Math.PI)
        ctx.fill()
        ctx.strokeStyle = "#000000"
        ctx.stroke()
    }

    if (mode == 0) {

        if (pts.length >= 2) {

            ctx.beginPath()
            let first = true

            T = []
            for (let k = 0; k < pts.length; k++) {
                if (mode_t == 0) {
                    T.push(k)
//                T.push(3*k+7)
                } else if (mode_t == 1) {
                    T.push(Math.cos( ((2*k)+1)*Math.PI / (2*pts.length) ) )
                }
            }

            let min_t = 50000000
            let max_t = -50000000

            for (let t of T) {
                min_t = Math.min(min_t, t)
                max_t = Math.max(max_t, t)
            }

            //for (let t = 0; t <= pts.length-0.95; t += 0.1) {
            for (let t = min_t; t <= max_t+0.0001; t += 0.004*(max_t-min_t)) {

                F_t = {"x": 0, "y": 0}

                for (let i = 0; i< pts.length; i++) {

                    Li_t = 1

                    for (let j = 0; j < pts.length; j++) {
                        if (j != i) {
                            Li_t *= (t - T[j]) / (T[i] - T[j])
                        }
                    }

                    F_t.x += pts[i].x*Li_t
                    F_t.y += pts[i].y*Li_t
                }

                if (first) {
                    first = false
                    ctx.moveTo(F_t.x, F_t.y)
                } else {
                    ctx.lineTo(F_t.x, F_t.y)
                }

                ctx.lineWidth = 3
                ctx.strokeStyle = "#ff0000"
                ctx.stroke()
                ctx.lineWidth = 1
            }
        }
    } else if (mode == 1 && pts.length >= 1) {

        let first = true

        for (let t = 0; t <= 1.0001; t+= 0.01) {
            pt = bezier(pts, t)

            if (first) {
                first = false
                ctx.beginPath()
                ctx.moveTo(pt.x, pt.y)
            } else {
                ctx.lineTo(pt.x, pt.y)
            }

            ctx.lineWidth = 3
            ctx.strokeStyle = "#ff0000"
            ctx.stroke()
            ctx.lineWidth = 1
        }

    } else if (mode == 2) {

        let n = pts.length-1-m

//        for (let k = 0; k <= n-1; k++) {
        for (let k = 0; k <= n+m; k++) {

            let first = true

            for (let t = 0; t <= 1; t+= 0.01) {

                let pts_prime = []

                for (let i = 0; i <= m; i++) {
//                    pts_prime.push(pts[k+i])
                    pts_prime.push(pts[(k+i)%pts.length])
                }

                pt = spline(pts_prime, m, t)

                if (first) {
                    first = false
                    ctx.beginPath()
                    ctx.moveTo(pt.x, pt.y)
                } else {
                    ctx.lineTo(pt.x, pt.y)
                }

                ctx.lineWidth = 3
                ctx.strokeStyle = "#ff0000"
                ctx.stroke()
                ctx.lineWidth = 1
            }
        }

    }


    requestAnimationFrame(animate)

}


