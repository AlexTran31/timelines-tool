import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";

const initialStartDate = "2025-03-01";
const initialTasks = [
  {
    id: 1,
    name: "Proto Sample",
    start: 0,
    duration: 5,
    color: "steelblue",
    row: 0,
  },
  {
    id: 2,
    name: "Lab Dips",
    start: null,
    duration: 7,
    color: "orange",
    row: 1,
    dependsOn: 1,
  },
  {
    id: 3,
    name: "Size Set Sample",
    start: null,
    duration: 10,
    color: "green",
    row: 0,
    dependsOn: 1,
  },
  {
    id: 4,
    name: "Material Preparation",
    start: null,
    duration: 8,
    color: "purple",
    dependsOn: 2,
    row: 1,
  },
  { id: 5, name: "Production", start: 20, duration: 15, color: "red", row: 1 },
];

const ROW_SPACING = 70;
const MAX_DURATION = 30;
const MAX_PRODUCTION_DURATION = 50;
const WIDTH = 700,
  HEIGHT = 250;

const StackedTimeline = () => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [tasks1, setTasks1] = useState(
    JSON.parse(JSON.stringify(initialTasks))
  );
  const [tasks2, setTasks2] = useState(
    JSON.parse(JSON.stringify(initialTasks))
  );

  const svgRef1 = useRef();
  const svgRef2 = useRef();
  const scale = d3.scaleLinear().domain([0, 80]).range([0, WIDTH]);

  const formatDate = (daysOffset) => {
    const baseDate = new Date(startDate);
    baseDate.setDate(baseDate.getDate() + daysOffset);
    return baseDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const updateTaskDependencies = (tasks) => {
    const updatedTasks = [...tasks];
    updatedTasks.forEach((task) => {
      if (task.dependsOn) {
        const dependency = updatedTasks.find((t) => t.id === task.dependsOn);
        if (dependency) {
          task.start = dependency.start + dependency.duration;
        }
      }
    });

    const row1Tasks = updatedTasks.filter((t) => t.row === 1);
    row1Tasks.sort((a, b) => a.start - b.start);
    for (let i = 1; i < row1Tasks.length; i++) {
      row1Tasks[i].start = row1Tasks[i - 1].start + row1Tasks[i - 1].duration;
    }

    return updatedTasks;
  };

  useEffect(() => {
    setTasks1(updateTaskDependencies(tasks1));
    setTasks2(updateTaskDependencies(tasks2));
  }, [startDate]);

  const drawChart = (svgRef, tasks, setTasks) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const group = svg.append("g").attr("transform", "translate(20,50)");

    const updateTasks = (updatedTask) => {
      const newTasks = [...tasks];
      const index = newTasks.findIndex((t) => t.id === updatedTask.id);

      if (index !== -1) {
        newTasks[index] = updatedTask;
        setTasks(updateTaskDependencies(newTasks));
      }
    };

    const resize = d3.drag().on("drag", function (event, d) {
      const maxLimit =
        d.name === "Production" ? MAX_PRODUCTION_DURATION : MAX_DURATION;
      const newDuration = Math.max(
        1,
        Math.min(maxLimit, scale.invert(event.x) - d.start)
      );
      d.duration = Math.round(newDuration);
      updateTasks(d);
    });

    const bars = group.selectAll("g").data(tasks).enter().append("g");

    bars
      .append("rect")
      .attr("x", (d) => scale(d.start))
      .attr("y", (d) => d.row * ROW_SPACING)
      .attr("width", (d) => scale(d.duration) - 2)
      .attr("height", 30)
      .attr("fill", (d) => d.color);

    bars
      .append("text")
      .attr("x", (d) => scale(d.start) + 5)
      .attr("y", (d) => d.row * ROW_SPACING + 20)
      .attr("fill", "white")
      .text((d) => d.name);

    bars
      .append("text")
      .attr("x", (d) => scale(d.start + d.duration / 2))
      .attr("y", (d) => d.row * ROW_SPACING + 45)
      .attr("fill", "black")
      .style("font-size", "12px")
      .style("text-anchor", "middle")
      .text((d) => `${d.duration} days`);

    bars
      .append("text")
      .attr("x", (d) => scale(d.start))
      .attr("y", (d) => d.row * ROW_SPACING - 10)
      .attr("fill", "black")
      .style("font-size", "12px")
      .style("text-anchor", "middle")
      .text((d) => formatDate(d.start));

    bars
      .append("text")
      .attr("x", (d) => scale(d.start + d.duration))
      .attr("y", (d) => d.row * ROW_SPACING - 10)
      .attr("fill", "black")
      .style("font-size", "12px")
      .style("text-anchor", "middle")
      .text((d) => formatDate(d.start + d.duration));

    bars
      .append("rect")
      .attr("x", (d) => scale(d.start + d.duration) - 5)
      .attr("y", (d) => d.row * ROW_SPACING)
      .attr("width", 10)
      .attr("height", 30)
      .attr("fill", "black")
      .style("cursor", "ew-resize")
      .call(resize);
  };

  useEffect(() => {
    drawChart(svgRef1, tasks1, setTasks1);
    drawChart(svgRef2, tasks2, setTasks2);
  }, [tasks1, tasks2]);

  return (
    <div>
      <label>
        Start Date:
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </label>
      <h3>Scenario 1</h3>
      <svg ref={svgRef1} width={WIDTH} height={HEIGHT} />
      <h3>Scenario 2</h3>
      <svg ref={svgRef2} width={WIDTH} height={HEIGHT} />
    </div>
  );
};

export default StackedTimeline;
