// Enemy rendering helpers.
"use strict";

  function renderEnemy(ctx, enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.facing || 0);
    const color = enemy.hitFlash > 0 ? "#ffffff" : enemy.color;
    ctx.fillStyle = color;
    ctx.strokeStyle = enemy.elite ? "#fff0b2" : "#152030";
    ctx.lineWidth = enemy.type === "boss" ? 4 : 2.5;

    if (enemy.type === "boss") {
      ctx.beginPath();
      ctx.moveTo(enemy.radius, 0);
      for (let index = 1; index < 10; index += 1) {
        const angle = (index / 10) * TWO_PI;
        const radius = enemy.radius - (index % 2 === 0 ? 10 : 0);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.kind === "crawler") {
      ctx.beginPath();
      ctx.moveTo(enemy.radius, 0);
      ctx.lineTo(-enemy.radius * 0.7, enemy.radius * 0.7);
      ctx.lineTo(-enemy.radius * 0.3, 0);
      ctx.lineTo(-enemy.radius * 0.7, -enemy.radius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.kind === "raider") {
      ctx.beginPath();
      ctx.moveTo(enemy.radius, 0);
      ctx.lineTo(0, enemy.radius * 0.9);
      ctx.lineTo(-enemy.radius, 0);
      ctx.lineTo(0, -enemy.radius * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.kind === "gunner") {
      ctx.fillRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
      ctx.strokeRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
    } else if (enemy.kind === "mortar") {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#fff0b2";
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 0.45, 0, TWO_PI);
      ctx.stroke();
    } else if (enemy.kind === "wasp") {
      ctx.beginPath();
      ctx.moveTo(enemy.radius, 0);
      ctx.lineTo(0, enemy.radius * 0.6);
      ctx.lineTo(-enemy.radius, 0);
      ctx.lineTo(0, -enemy.radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.kind === "sentinel") {
      ctx.beginPath();
      for (let index = 0; index < 8; index += 1) {
        const angle = (index / 8) * TWO_PI;
        const radius = enemy.radius;
        if (index === 0) {
          ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        } else {
          ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.kind === "siphon") {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(9, 13, 28, 0.92)";
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 0.34, 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = "#f0d4ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 0.34, 0, TWO_PI);
      ctx.stroke();
    }

    if (enemy.shield > 0) {
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = "#9feaff";
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 6, 0, TWO_PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (enemy.commandLink > 0 || enemy.siphonInfusion > 0 || enemy.emberInfusion > 0) {
      const auraColor = enemy.emberInfusion > 0
        ? "#ff9b5c"
        : enemy.siphonInfusion > 0
          ? "#e0a0ff"
          : "#ffc18f";
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 10, 0, TWO_PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (enemy.type === "boss" || enemy.elite || enemy.hitFlash > 0.05) {
      const width = enemy.type === "boss" ? 110 : 44;
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 22, width, 6);
      ctx.fillStyle = enemy.type === "boss" ? "#ffb36a" : "#7dd6ff";
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 22, width * (enemy.hp / enemy.maxHp), 6);
    }
    if (enemy.objectiveTarget) {
      ctx.strokeStyle = "#ffb889";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 10 + Math.sin(game.time * 5 + enemy.id) * 2, 0, TWO_PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - enemy.radius - 16);
      ctx.lineTo(enemy.x, enemy.y - enemy.radius - 54);
      ctx.stroke();
    }
    if (enemy.reactorFocus && game.run?.objective?.type === "defense" && !game.run.objective.complete) {
      ctx.fillStyle = "#ffe08c";
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - enemy.radius - 16);
      ctx.lineTo(enemy.x + 8, enemy.y - enemy.radius - 30);
      ctx.lineTo(enemy.x - 8, enemy.y - enemy.radius - 30);
      ctx.closePath();
      ctx.fill();
    }
    if (enemy.convoyFocus && game.run?.objective?.type === "escort" && !game.run.objective.complete) {
      ctx.fillStyle = "#ffd39a";
      ctx.beginPath();
      ctx.rect(enemy.x - 5, enemy.y - enemy.radius - 32, 10, 10);
      ctx.fill();
    }
  }
