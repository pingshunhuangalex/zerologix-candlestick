'use strict';

var margin = { top: 20, right: 20, bottom: 30, left: 50 };
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

var draw = function draw() {
  svg.select('g.candlestick').call(candlestick);
  // using refresh method is more efficient as it does not perform any data joins
  // Use this if underlying data is not changing
  // svg.select('g.candlestick').call(candlestick.refresh);
  svg.select('g.x.axis').call(xAxis);
  svg.select('g.y.axis').call(yAxis);
};

var zoomed = function zoomed() {
  var rescaledY = d3.event.transform.rescaleY(y);
  yAxis.scale(rescaledY);
  candlestick.yScale(rescaledY);

  // Emulates D3 behaviour, required for financetime due to secondary zoomable scale
  x.zoomable().domain(d3.event.transform.rescaleX(zoomableInit).domain());

  draw();
};

var update = function update() {
  d3.json('../data/data.json', function (error, data) {
    var accessor = candlestick.accessor();
    var candleNo = document.getElementById('candle-control').value;
    var dataRange = void 0;

    if (candleNo) {
      dataRange = data.slice(0, candleNo);
    } else {
      dataRange = data;
    }

    data = dataRange.map(function (d) {
      return {
        date: new Date(+d.u * 1000),
        open: +d.o,
        high: +d.h,
        low: +d.l,
        close: +d.c
      };
    }).sort(function (a, b) {
      return d3.ascending(accessor.d(a), accessor.d(b));
    });

    x.domain(data.map(accessor.d));
    y.domain(techan.scale.plot.ohlc(data, accessor).domain());

    svg.select('g.candlestick').datum(data);
    draw();

    // Associate the zoom with the scale after a domain has been applied
    // Stash initial settings to store as baseline for zooming
    zoomableInit = x.zoomable().clamp(false).copy();
  });
};

document.querySelector('#candle-update').addEventListener('click', update);

var x = techan.scale.financetime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);
var zoom = d3.zoom().on('zoom', zoomed);
var zoomableInit = void 0;
var candlestick = techan.plot.candlestick().xScale(x).yScale(y);
var xAxis = d3.axisBottom(x);
var yAxis = d3.axisLeft(y);

var svg = d3.select('.chart').append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

svg.append('clipPath').attr('id', 'clip').append('rect').attr('x', 0).attr('y', y(1)).attr('width', width).attr('height', y(0) - y(1));

svg.append('g').attr('class', 'candlestick').attr('clip-path', 'url(#clip)');

svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0, ' + height + ')');

svg.append('g').attr('class', 'y axis').append('text').attr('transform', 'rotate(-90)').attr('y', 6).attr('dy', '.71em').style('text-anchor', 'end').text('Price ($)');

svg.append('rect').attr('class', 'pane').attr('width', width).attr('height', height).call(zoom);

update();