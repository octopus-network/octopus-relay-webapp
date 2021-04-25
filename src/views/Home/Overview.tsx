import React, { Component } from 'react';
import { ProgressPlugin } from 'webpack';

import styled from 'styled-components';

const StatisticsWrap = styled.div`
  display: flex;
  max-width: 920px;
  margin: 0 auto;
  .statistic {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .number {
      font-size: 28px;
      color: rgba(255, 255, 255, 1);
      font-weight: 500;
    }
    .desc {
      color: rgba(255, 255, 255, .5);
      font-style: normal;
      font-size: 13px;
    }
  }
`;

interface Props {
  height: number;
  paddingTop: number;
  numberAppchains: number;
  stakedBalance: number;
  blockHeight: number;
}

interface State {
  resizeTimeout: number;
  resizeCooldown: number;
  lastResizeTime: number;
  lastPaintTime: number;
}

class Star {
  ctx: any;
  size: number;
  speed: number;
  x: number;
  y: number;

  constructor({ canvas, size, speed }) {
    this.ctx = canvas.getContext('2d');
    
    this.size = size;
    this.speed = speed;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
  }

  animate(delta) {
    this.x += this.speed * delta;
    this.y -= this.speed * delta;
    if (this.y < 0) {
      this.y = this.ctx.canvas.height;
    }
    if (this.x > this.ctx.canvas.width) {
      this.x = 0;
    }
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

class Overview extends Component<Props, State> {
  canvas: any;
  _isMounted: boolean;
  stars: Star[];

  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.state = {
      resizeTimeout: 0,
      resizeCooldown: 500,
      lastPaintTime: 0,
      lastResizeTime: Date.now()
    }
  }

  componentDidMount() {
    this.initializeBackground();
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  initializeBackground() {
    const canvas = this.canvas.current;
    canvas.width = window.innerWidth;
    canvas.height = this.props.height;

    window.addEventListener('resize', () => {
      const { resizeTimeout, resizeCooldown, lastResizeTime } = this.state;

      const now = Date.now()
      if (now - lastResizeTime < resizeCooldown && resizeTimeout) {
        clearTimeout(resizeTimeout);
        this.setState({ resizeTimeout: null });
      }

      this.setState({ lastResizeTime: now });
      canvas.style.disply = 'none';

      let timer = setTimeout(() => {
        this.fadeIn();
        this.initializeStars();
      }, 500);

      canvas.width = window.innerWidth;
    });

    this.initializeStars();
    (window.requestAnimationFrame && requestAnimationFrame(ts =>this.paintLoop(ts))) || 
      setTimeout((ts) => this.paintLoop(ts), 16);
  }

  fadeIn() {
    const canvas = this.canvas.current;
    canvas.style.opacity = 0;
    setTimeout(() => {
      canvas.style.opacity = 1;
    }, 500);
  }

  initializeStars() {
    const canvas = this.canvas.current;
    let winArea = window.innerWidth * this.props.height;
    let smallStarsDensity = 0.0001;
    let mediumStarsDensity = 0.00005;
    let largeStarsDensity = 0.00002;
    let smallStarsCount = winArea * smallStarsDensity;
    let mediumStarsCount = winArea * mediumStarsDensity;
    let largeStarsCount = winArea * largeStarsDensity;
    const stars: Star[] = [];
    for (var i = 0; i < smallStarsCount; i++) {
      stars.push(new Star({ canvas, size: 1, speed: 30 }));
    }

    for (var i = 0; i < mediumStarsCount; i++) {
      stars.push(new Star({ canvas, size: 2, speed: 20 }));
    }

    for (var i = 0; i < largeStarsCount; i++) {
      stars.push(new Star({ canvas, size: 3, speed: 10 }));
    }

    this.stars = stars;
  }

  paintLoop(timestamp) {
    if (!this._isMounted) return;
    const canvas = this.canvas.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    var delta =
      (window.requestAnimationFrame ? timestamp - this.state.lastPaintTime : 16) / 1000;
    if(delta > 0.05){
      delta = 0.05;
    }
    this.drawStars(delta);
    (window.requestAnimationFrame && requestAnimationFrame(ts =>this.paintLoop(ts))) || 
      setTimeout((ts) => this.paintLoop(ts), 16);
    this.setState({ lastPaintTime: timestamp });
  }
  
  drawStars(delta) {
    
    for (let i = 0; i < this.stars.length; i++) {
      this.stars[i].animate(delta);
    }
  }

  render() {
    return (
      <div style={{ 
        backgroundImage: 'linear-gradient(180deg, #0e1118, #232b3e)', height: this.props.height + 'px',
        backgroundColor: '#0a083b', position: 'relative', paddingTop: this.props.paddingTop + 'px'
      }}>
        <canvas ref={this.canvas} style={{ position: 'absolute', top: '0', zIndex: 0 }}></canvas>
        <StatisticsWrap style={{ position: 'relative', zIndex: 1 }}>
          <div className='statistic' style={{ height: `calc(${this.props.height}px - ${this.props.paddingTop}px)`}}>
            <span className='number'>{this.props.numberAppchains}</span>
            <em className='desc'>Total Appchains</em>
          </div>
          <div className='statistic' style={{ height: `calc(${this.props.height}px - ${this.props.paddingTop}px)`}}>
            <span className='number'>{this.props.stakedBalance}</span>
            <em className='desc'>Staked OCT</em>
          </div>
          <div className='statistic' style={{ height: `calc(${this.props.height}px - ${this.props.paddingTop}px)`}}>
            <span className='number'>{this.props.blockHeight}</span>
            <em className='desc'>Block Height</em>
          </div>
        </StatisticsWrap>
      </div>
    );
  }
}

export default React.memo(Overview);