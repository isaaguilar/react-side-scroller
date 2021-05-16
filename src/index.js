import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router , Route, Link, Switch } from 'react-router-dom';

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

export default function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

const useKeyPress = function(targetKey) {
  const [keyPressed, setKeyPressed] = useState(false);

  function downHandler({ key }) {
    if (key === targetKey) {
      setKeyPressed(true);
    }
  }

  const upHandler = ({ key }) => {
    if (key === targetKey) {
      setKeyPressed(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);

    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  });

  return keyPressed;
};

const items = [
  { id: 1, name: "Josh Weir" },
  { id: 2, name: "Sarah Weir" },
  { id: 3, name: "Alicia Weir" },
  { id: 4, name: "Doo Weir" },
  { id: 5, name: "Grooft Weir" }
];

const ListItem = ({ item, active, setSelected, setHovered }) => (
  <div
    className={`item ${active ? "active" : ""}`}
    onClick={() => setSelected(item)}
    onMouseEnter={() => setHovered(item)}
    onMouseLeave={() => setHovered(undefined)}
  >
    {item.name}
  </div>
);

const ListExample = () => {
  const [selected, setSelected] = useState(undefined);
  const downPress = useKeyPress("ArrowDown");

  const upPress = useKeyPress("ArrowUp");
  const enterPress = useKeyPress("Enter");
  const spacePress = useKeyPress(" ");
  const [cursor, setCursor] = useState(0);
  const [hovered, setHovered] = useState(undefined);

  useEffect(() => {
    if (spacePress) {
      console.log("Spacebar is pressed!")
    }
  }, [spacePress])

  useEffect(() => {
    if (items.length && downPress) {
      setCursor(prevState =>
        prevState < items.length - 1 ? prevState + 1 : prevState
      );
    }
  }, [downPress]);
  useEffect(() => {
    if (items.length && upPress) {
      setCursor(prevState => (prevState > 0 ? prevState - 1 : prevState));
    }
  }, [upPress]);
  useEffect(() => {
    if (items.length && enterPress) {
      console.log("enter")
      console.log(cursor)
      setSelected(items[cursor]);
    }
  }, [cursor, enterPress]);
  useEffect(() => {
    if (items.length && hovered) {
      setCursor(items.indexOf(hovered));
    }
  }, [hovered]);

  return (
    <div>
      <p>
        <small>
          Use up down keys and hit enter to select, or use the mouse
        </small>
      </p>
      <span>Selected: {selected ? selected.name : "none"}</span>
      {items.map((item, i) => (
        <ListItem
          key={item.id}
          active={i === cursor}
          item={item}
          setSelected={setSelected}
          setHovered={setHovered}
        />
      ))}
    </div>
  );
};



const Move = () => {
  const dimensions = useWindowDimensions()
  const rightPress = useKeyPress("ArrowRight");
  const leftPress = useKeyPress("ArrowLeft");
  const spacePress = useKeyPress(" ");
  const upPress = useKeyPress("ArrowUp");
  const downPress = useKeyPress("ArrowDown");
  const [navH, setNavH] = useState(dimensions.width/2);
  const [navV, setNavV] = useState(dimensions.height-dimensions.height/4);
  const [backgroundH, setBackgroundH] = useState(0);
  const [foregroundH, setForegroundH] = useState(0);
  const [absH, setAbsH] = useState(0)
  const [groundTiles, setGroundTiles] = useState(0);
  const [maxJumpV, setMaxJumpV] = useState(0)
  const [hovered, setHovered] = useState(undefined);
  const maxRight = dimensions.width - dimensions.width/4
  const maxLeft = dimensions.width/4
  const maxUp = dimensions.height/4
  const maxDown = dimensions.height - dimensions.height/4
  const [currentUp, setCurrentUp] = useState(maxDown)
  const [currentDown, setCurrentDown] = useState(maxDown)


  const foregroundMoveSpeed = 6
  const midgroundMoveSpeed = 3
  const backgroundMoveSpeed = 2

  //  --- THE JUMP ---
  // 90 degree jump is:
  //
  //    H = v^2/2g
  //
  // But I need to account for having to set state every turn:
  //
  //    H = v_h^2/2g + h

  // Then get the new v_h:
  //
  //    v_h = v_0 - gt
  //
  const [currentJumpTime, setCurrentJumpTime] = useState(0)
  const [currentVelocity, setCurrentVelocity] = useState(0)
  const [jumpStarted, setJumpStarted] = useState(false)
  const [jumpLoop, setJumpLoop] = useState(0)
  const g = .7// pixels/t^2
  const v_0 = 6 // pixels/t
  const t = .5

  if (spacePress && !jumpStarted) {
    setCurrentVelocity(v_0)
    setJumpStarted(true)
    setCurrentJumpTime(t)
    setJumpLoop(1)
    setCurrentDown(navV)
  }

  useEffect(() => {
     if (jumpStarted) {
      setTimeout(function(){
      if (currentVelocity <= -v_0) {
          setJumpStarted(false)
          setCurrentJumpTime(0)
          setCurrentVelocity(0)
        } else {
          setCurrentVelocity(v_0 - g*currentJumpTime)
          setCurrentJumpTime(prevState => (prevState + t))
          setJumpLoop(prevState => (prevState + 1))
        }

        let h = (currentVelocity * currentVelocity) / (2 * g)
        if (currentVelocity < 0) {
          h = -h
        }
        // console.log(currentVelocity)
        setNavV(prevState => (
            (prevState - h) > currentDown ? currentDown : prevState - h
        ))
      }, 10);
    }
  }, [jumpLoop]);


  useEffect(() => {
    if (rightPress && !leftPress) {
      if (blockRight()) {
        return
      }
      setTimeout(function(){
        setAbsH(prevState => (prevState + foregroundMoveSpeed))
        setGroundTiles(prevState => (
          Math.ceil(absH/dimensions.width)
        ))
        setNavH(prevState => (
          prevState < maxRight ? prevState + foregroundMoveSpeed : prevState
        ));
        setBackgroundH( prevState => (
          navH >= maxRight ? prevState - midgroundMoveSpeed : prevState
        ))
        setForegroundH( prevState => (
          navH >= maxRight ? prevState - foregroundMoveSpeed : prevState
        ))
      }, 10);
    }
  }, [rightPress, leftPress, absH]);
  useEffect(() => {
    if (leftPress && !rightPress) {
      if (blockRight()) {
        return
      }
      setTimeout(function(){
        setAbsH(prevState => (prevState - foregroundMoveSpeed))
        setGroundTiles(prevState => (
          Math.ceil(absH/dimensions.width)
        ))

        setNavH(prevState => (
          prevState >= maxLeft ? prevState - foregroundMoveSpeed : prevState
        ));
        setBackgroundH( prevState => (
          navH <= maxLeft ? prevState + midgroundMoveSpeed : prevState
        ))
        setForegroundH( prevState => (
          navH <= maxLeft ? prevState + foregroundMoveSpeed : prevState
        ))
      }, 10);

    }

  }, [leftPress, rightPress, absH]);
  useEffect(() => {
    if (upPress && ! downPress) {
      setTimeout(function(){
        setNavV(prevState => (
          prevState >= maxUp ? prevState - foregroundMoveSpeed : prevState
        ));
      }, 10);
    }
  }, [upPress, downPress, navV]);
  useEffect(() => {
    if (downPress && !upPress) {
      setTimeout(function(){
        setNavV(prevState => (
          prevState < (maxDown) ? prevState + foregroundMoveSpeed : prevState
        ));
      }, 10);

    }
  }, [downPress, upPress, navV]);



  function range(start, end) {
    var ans = [];
    for (let i = start; i <= end; i++) {
      ans.push(i);
    }
    return ans;
  }

  const rangeTiles = [groundTiles - 2, groundTiles - 1, groundTiles, groundTiles + 1]

  const world = {
    blocks: [
      {
        top: dimensions.height - dimensions.height/3,
        left: (dimensions.width - dimensions.width/4) + foregroundH,
        width: dimensions.width/4,
        height: dimensions.height/8,
      },
      {
        top: dimensions.height - dimensions.height/3,
        left: (-dimensions.width/4) + foregroundH,
        width: dimensions.width/8,
        height: dimensions.height/8,
      }
    ]
  }

  const blockRight = (() => {

    for (const i in world.blocks) {
      const block = world.blocks[i]
      if (
        navH+(foregroundMoveSpeed*3) >= (block.left) &&
        navH-(foregroundMoveSpeed*3) <= (block.left + block.width) &&
        navV > dimensions.height - dimensions.height/3
      ){

        if (
          rightPress &&
          block.left <= navH+(foregroundMoveSpeed*3)
        ){
          console.log("right",true)
          return true
        } else if (
          leftPress &&
          (block.left + block.width) >= navH+(foregroundMoveSpeed*60)
        ){
          return true
        }

      }

    }

    return false


  })
   const blockLeft = (() => {
     for (const i in world.blocks) {
       const block = world.blocks[i]
       if (
         leftPress &&
         navH+19 >= (block.left) &&
         navH-8 <= (block.left + block.width) &&
         navV > dimensions.height - dimensions.height/3
       ) {
         console.log("left",true)
         return true
       }
     }

     // if (
     //   navH-8 <= ((-dimensions.width/4 + dimensions.width/8) + foregroundH) &&
     //   navV > dimensions.height - dimensions.height/3
     // ) {
     //   return true
     // }
     return false
   })

  return (
    <span>
      <div
        style={{
          display: "inline-block",
          position: "absolute",
          fontSize: "1.5em",
          border: "6px solid black",
          margin: "auto",
          left: "1%",
          right: "1%",
          top: dimensions.height/16,
          textAlign: "center"
        }}
      >
        Isa Aguilar <br/>vs<br/> The World
      </div>
      <div style={{position: "absolute", left: navH, top: navV}}>
        •
      </div>
      <div>
        test: { navH },{ navV }
      </div>
      <div>
        Window Dimensions: { dimensions.width }, { dimensions.height } | GroundTiles: { groundTiles }
      </div>
      <div
        style={{
          overflow: "hidden",
          overflowX: "hidden",
          whiteSpace: "nowrap",
          display: "inline-block",
          position: "absolute",
          fontSize: "4em",
          left: backgroundH,
          top: dimensions.height - dimensions.height/2
        }}
      >
        🌲&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        🌲&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        🌲
      </div>

      { rangeTiles.map((i) => {
        return (
          <div key={i}>
            <div
              style={{
                display: "inline-block",
                overflow: "hidden",
                position: "absolute",
                fontSize: "1.5em",
                whiteSpace: "nowrap",
                left: dimensions.width * i + foregroundH,
                maxWidth: "100%",
                top: dimensions.height - dimensions.height/4 + dimensions.height/16,
                textAlign: "center"
              }}
              dangerouslySetInnerHTML={{__html: "/&nbsp;&nbsp;".repeat(100)}}
           />
          </div>

        )
      })}

      {world.blocks.map(block => (
        <div
          style={{
            position: "fixed",
            top: block.top,
            left: block.left,
            width: block.width,
            height: block.height,
            display: "inline-block",
            background: "orange",
            border: "10px solid purple"

          }}
        />
      ))}

      

    </span>
  )
}

ReactDOM.render(
    <Router>
        <Switch>
            <Route path="/">
                {/*<ListExample />*/}
                <Move />
            </Route>
        </Switch>
    </Router>,
  document.getElementById("app")
)
