// 롤토체스 스타일 전투 시스템
// 자동 전투 로직

class BattleSystem {
    constructor() {
        this.battleGrid = {
            width: 7,
            height: 4
        };
        this.updateInterval = 100; // ms
        this.battleTimer = null;
    }

    // 전투 시작
    startBattle(playerUnits, enemyUnits) {
        const player = this.prepareTeam(playerUnits, true);
        const enemy = this.prepareTeam(enemyUnits, false);
        
        return new Promise((resolve) => {
            this.runBattle(player, enemy, resolve);
        });
    }

    // 팀 준비 (위치 설정)
    prepareTeam(units, isPlayer) {
        const team = [];
        const startY = isPlayer ? 0 : this.battleGrid.height - 1;
        
        units.forEach((unit, index) => {
            if (!unit.position) return;
            
            // 딥 카피하되 함수는 보존
            const battleUnit = {
                ...unit,
                stats: { ...unit.stats },
                traits: [...unit.traits],
                skill: unit.skill ? { ...unit.skill, effect: unit.skill.effect } : null,
                items: unit.items ? [...unit.items] : [],
                id: `${isPlayer ? 'p' : 'e'}_${unit.id}_${index}`,
                x: unit.position.x,
                y: isPlayer ? unit.position.y : (this.battleGrid.height - 1 - unit.position.y),
                isPlayer: isPlayer,
                currentHp: unit.stats.hp,
                currentMana: 0,
                target: null,
                attackCooldown: 0,
                isMoving: false,
                isDead: false,
                stunned: false,
                buffAttackDamage: 0,
                shield: 0
            };
            
            // 아이템 효과 적용
            if (battleUnit.items && battleUnit.items.length > 0) {
                battleUnit.items.forEach(item => {
                    if (item.stats) {
                        Object.keys(item.stats).forEach(stat => {
                            if (stat.includes('Multiplier')) {
                                const baseStat = stat.replace('Multiplier', '');
                                battleUnit.stats[baseStat] *= (1 + item.stats[stat]);
                            } else if (['critChance', 'evasion', 'lifesteal', 'damageReduction', 'thornsDamage'].includes(stat)) {
                                battleUnit[stat] = (battleUnit[stat] || 0) + item.stats[stat];
                            } else if (stat === 'hp') {
                                battleUnit.stats.hp += item.stats[stat];
                                battleUnit.currentHp += item.stats[stat];
                            } else {
                                battleUnit.stats[stat] = (battleUnit.stats[stat] || 0) + item.stats[stat];
                            }
                        });
                    }
                    // 특수 효과
                    if (item.special) {
                        battleUnit[item.special] = true;
                    }
                });
            }
            
            team.push(battleUnit);
        });
        
        return team;
    }

    // 전투 실행
    runBattle(playerTeam, enemyTeam, resolve) {
        let ticks = 0;
        const maxTicks = 60000 / this.updateInterval; // 60초 제한
        const maxSeconds = 60;
        
        const battleLoop = setInterval(() => {
            ticks++;
            
            // 전투 타이머 업데이트 (1초마다)
            if (ticks % 10 === 0) { // updateInterval이 100ms이므로 10틱 = 1초
                const secondsElapsed = Math.floor(ticks / 10);
                const secondsRemaining = maxSeconds - secondsElapsed;
                
                // UI 업데이트 (모달과 최소화 바 모두)
                const battleTimerEl = document.getElementById('battleTimer');
                const battleTimerMiniEl = document.getElementById('battleTimerMini');
                
                if (battleTimerEl) {
                    battleTimerEl.textContent = Math.max(0, secondsRemaining);
                    
                    // 색상 변경
                    if (secondsRemaining <= 10) {
                        battleTimerEl.style.color = '#e74c3c'; // 빨간색
                    } else if (secondsRemaining <= 20) {
                        battleTimerEl.style.color = '#f39c12'; // 주황색
                    } else {
                        battleTimerEl.style.color = '#2ecc71'; // 초록색
                    }
                }
                
                if (battleTimerMiniEl) {
                    battleTimerMiniEl.textContent = Math.max(0, secondsRemaining);
                    
                    // 색상 변경
                    if (secondsRemaining <= 10) {
                        battleTimerMiniEl.style.color = '#e74c3c'; // 빨간색
                    } else if (secondsRemaining <= 20) {
                        battleTimerMiniEl.style.color = '#f39c12'; // 주황색
                    } else {
                        battleTimerMiniEl.style.color = '#2ecc71'; // 초록색
                    }
                }
            }
            
            // 승리 조건 체크 - 한 팀이 전멸했는지만 확인
            const playersAlive = playerTeam.filter(u => !u.isDead).length;
            const enemiesAlive = enemyTeam.filter(u => !u.isDead).length;
            
            // 한쪽이 전멸하거나 시간 초과 시에만 전투 종료
            if (playersAlive === 0 || enemiesAlive === 0 || ticks >= maxTicks) {
                clearInterval(battleLoop);
                
                // 승리 판정
                let winner;
                if (playersAlive > 0 && enemiesAlive === 0) {
                    winner = 'player'; // 플레이어만 생존
                } else if (enemiesAlive > 0 && playersAlive === 0) {
                    winner = 'enemy'; // 적만 생존
                } else if (ticks >= maxTicks) {
                    // 시간 초과 - 더 많이 생존한 쪽이 승리
                    if (playersAlive > enemiesAlive) {
                        winner = 'player';
                    } else if (enemiesAlive > playersAlive) {
                        winner = 'enemy';
                    } else {
                        winner = 'draw'; // 동일한 수
                    }
                } else {
                    winner = 'draw'; // 둘 다 0
                }
                
                resolve({
                    winner,
                    playerUnitsLeft: playersAlive,
                    enemyUnitsLeft: enemiesAlive,
                    playerTeam,
                    enemyTeam
                });
                return;
            }
            
            // 모든 유닛 업데이트
            this.updateUnits(playerTeam, enemyTeam);
            this.updateUnits(enemyTeam, playerTeam);
            
        }, this.updateInterval);
    }

    // 유닛 업데이트
    updateUnits(allies, enemies) {
        allies.forEach(unit => {
            // 체력이 0 이하면 사망 처리
            if (unit.currentHp <= 0 && !unit.isDead) {
                this.handleDeath(unit, allies, enemies);
            }
            
            if (unit.isDead || unit.stunned) {
                if (unit.stunned) {
                    unit.stunnedTime = (unit.stunnedTime || 0) + this.updateInterval;
                    if (unit.stunnedTime >= 1000) {
                        unit.stunned = false;
                        unit.stunnedTime = 0;
                    }
                }
                return;
            }
            
            // 체력 회복
            if (unit.hpRegen) {
                unit.currentHp = Math.min(unit.currentHp + unit.hpRegen * (this.updateInterval / 1000), unit.stats.hp);
            }
            
            // 마나 회복
            const baseRegen = 8; // 초당 기본 마나 회복
            const totalRegen = baseRegen + (unit.manaRegen || 0);
            unit.currentMana = Math.min(unit.currentMana + totalRegen * (this.updateInterval / 1000), unit.stats.maxMana);
            
            // 타겟 찾기
            if (!unit.target || unit.target.isDead) {
                unit.target = this.findTarget(unit, enemies);
            }
            
            if (!unit.target) return;
            
            // 스킬 사용 (마나가 가득 찬 경우)
            if (unit.currentMana >= unit.stats.maxMana) {
                this.castSkill(unit, allies, enemies);
                unit.currentMana = 0;
            }
            
            // 공격 쿨다운 감소
            if (unit.attackCooldown > 0) {
                unit.attackCooldown -= this.updateInterval;
            }
            
            // 이동 및 공격
            const distance = this.getDistance(unit, unit.target);
            const attackRange = unit.stats.attackRange;
            
            if (distance > attackRange) {
                // 이동
                this.moveTowards(unit, unit.target);
            } else {
                // 공격
                if (unit.attackCooldown <= 0) {
                    this.attack(unit, unit.target, allies, enemies);
                    unit.attackCooldown = 1000 / unit.stats.attackSpeed; // 공격 속도에 따른 쿨다운
                }
            }
        });
    }

    // 타겟 찾기 (가장 가까운 적)
    findTarget(unit, enemies) {
        const aliveEnemies = enemies.filter(e => !e.isDead);
        if (aliveEnemies.length === 0) return null;
        
        // 거리 순으로 정렬
        aliveEnemies.sort((a, b) => {
            return this.getDistance(unit, a) - this.getDistance(unit, b);
        });
        
        return aliveEnemies[0];
    }

    // 거리 계산
    getDistance(unit1, unit2) {
        return Math.sqrt(Math.pow(unit1.x - unit2.x, 2) + Math.pow(unit1.y - unit2.y, 2));
    }

    // 이동
    moveTowards(unit, target) {
        const dx = target.x - unit.x;
        const dy = target.y - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        const speed = unit.stats.movementSpeed * (this.updateInterval / 1000);
        const moveX = (dx / distance) * speed;
        const moveY = (dy / distance) * speed;
        
        unit.x += moveX;
        unit.y += moveY;
        
        // 그리드 경계 체크
        unit.x = Math.max(0, Math.min(this.battleGrid.width - 1, unit.x));
        unit.y = Math.max(0, Math.min(this.battleGrid.height - 1, unit.y));
    }

    // 공격
    attack(attacker, target, allies, enemies) {
        if (!target || target.isDead) return;
        
        // 회피 체크
        if (target.evasion && !attacker.trueStrike) {
            if (Math.random() < target.evasion) {
                return; // 회피 성공
            }
        }
        
        // 치명타 체크
        let damage = attacker.stats.attackDamage + (attacker.buffAttackDamage || 0);
        let isCrit = false;
        
        if (attacker.critChance && Math.random() < attacker.critChance) {
            isCrit = true;
            const critMultiplier = attacker.critDamage || 2;
            damage *= critMultiplier;
        }
        
        // 대전차 보너스
        if (attacker.antiArmor && target.traits && target.traits.includes('기갑')) {
            damage *= attacker.antiArmor;
        }
        
        // 방어력 계산
        const armorReduction = attacker.armorPenetration || 0;
        const effectiveArmor = target.stats.armor * (1 - armorReduction);
        const damageMultiplier = 100 / (100 + effectiveArmor);
        damage *= damageMultiplier;
        
        // 피해 감소
        if (target.damageReduction) {
            damage *= (1 - target.damageReduction);
        }
        
        // 방어막 먼저 소모
        if (target.shield > 0) {
            if (target.shield >= damage) {
                target.shield -= damage;
                damage = 0;
            } else {
                damage -= target.shield;
                target.shield = 0;
            }
        }
        
        // 피해 적용
        target.currentHp -= damage;
        
        // 마나 획득
        attacker.currentMana = Math.min(attacker.currentMana + 10, attacker.stats.maxMana);
        
        // 피격 시 마나 획득
        if (target.currentHp > 0) {
            target.currentMana = Math.min(target.currentMana + 10, target.stats.maxMana);
        }
        
        // 생명력 흡수
        if (attacker.lifesteal) {
            attacker.currentHp = Math.min(attacker.currentHp + damage * attacker.lifesteal, attacker.stats.hp);
        }
        
        // 가시 피해
        if (target.thornsDamage && attacker.currentHp > 0) {
            attacker.currentHp -= damage * target.thornsDamage;
        }
        
        // 광역 피해
        if (attacker.splashDamage) {
            enemies.forEach(enemy => {
                if (enemy.id !== target.id && !enemy.isDead) {
                    const dist = this.getDistance(target, enemy);
                    if (dist <= 1) {
                        enemy.currentHp -= damage * attacker.splashDamage;
                        if (enemy.currentHp <= 0) {
                            this.handleDeath(enemy, allies, enemies);
                        }
                    }
                }
            });
        }
        
        // 기절 확률
        if (attacker.stunChance && Math.random() < attacker.stunChance) {
            target.stunned = true;
            target.stunnedTime = 0;
        }
        
        // 제압 효과
        if (attacker.suppress) {
            const originalAS = target.stats.attackSpeed;
            target.stats.attackSpeed *= 0.7;
            setTimeout(() => { target.stats.attackSpeed = originalAS; }, 2000);
        }
        
        // 사망 체크
        if (target.currentHp <= 0) {
            this.handleDeath(target, allies, enemies);
        }
        
        // 분노 (체력 50% 이하)
        if (attacker.enrage && attacker.currentHp / attacker.stats.hp <= 0.5) {
            attacker.buffAttackDamage = (attacker.buffAttackDamage || 0) + attacker.stats.attackDamage * attacker.enrage;
        }
        
        // 아이템 효과 처리
        if (attacker.items) {
            processItemEffects(attacker, 'onAttack', { target, damage, allies, enemies });
        }
        
        // 멀티 스트라이크
        if (attacker.multiStrike) {
            for (let i = 1; i < attacker.multiStrike; i++) {
                setTimeout(() => {
                    if (!target.isDead) {
                        this.attack(attacker, target, allies, enemies);
                    }
                }, i * 100);
            }
        }
    }

    // 스킬 사용
    castSkill(unit, allies, enemies) {
        if (!unit.skill || !unit.skill.effect) {
            // 스킬이 없는 유닛은 조용히 무시 (크립 등)
            return;
        }
        
        const target = unit.target;
        
        // 스킬 피해 보너스 적용
        const originalDamage = unit.stats.attackDamage;
        if (unit.skillDamageBonus) {
            unit.stats.attackDamage *= (1 + unit.skillDamageBonus);
        }
        
        // 스킬 실행
        try {
            if (typeof unit.skill.effect === 'function') {
                unit.skill.effect(unit, target, allies, enemies);
            } else {
                console.error('Skill effect is not a function:', unit.skill);
            }
        } catch (e) {
            console.error('Skill execution error:', e, 'Unit:', unit.name);
        }
        
        // 원래 공격력 복구
        unit.stats.attackDamage = originalDamage;
        
        // 스킬로 인한 사망 체크 (모든 적)
        enemies.forEach(enemy => {
            if (enemy.currentHp <= 0 && !enemy.isDead) {
                this.handleDeath(enemy, enemies, allies);
            }
        });
        
        // 아군도 체크 (일부 스킬이 아군에게 영향 줄 수 있음)
        allies.forEach(ally => {
            if (ally.currentHp <= 0 && !ally.isDead) {
                this.handleDeath(ally, allies, enemies);
            }
        });
        
        // 아이템 효과 처리
        if (unit.items) {
            processItemEffects(unit, 'onSkill', { target, allies, enemies });
        }
    }

    // 사망 처리
    handleDeath(unit, allies, enemies) {
        // 부활 체크
        if (unit.revive && !unit.hasRevived) {
            unit.currentHp = unit.stats.hp * 0.5;
            unit.hasRevived = true;
            return;
        }
        
        // 부활 확률 체크
        if (unit.reviveChance && !unit.hasRevived && Math.random() < unit.reviveChance) {
            unit.currentHp = unit.stats.hp * 0.3;
            unit.hasRevived = true;
            return;
        }
        
        // 아이템 사망 효과
        let revived = false;
        if (unit.items) {
            revived = processItemEffects(unit, 'onDeath', {});
        }
        
        if (!revived) {
            unit.isDead = true;
            unit.currentHp = 0;
        }
    }

    // 피해 계산 (전투 결과로 플레이어 체력 감소)
    calculateDamage(unitsLeft, averageStarLevel) {
        const baseDamage = {
            1: 1, 2: 1, 3: 2, 4: 3,
            5: 5, 6: 7, 7: 10, 8: 15, 9: 20
        };
        
        let totalDamage = 0;
        unitsLeft.forEach(unit => {
            const stars = unit.stars || 1;
            totalDamage += (baseDamage[averageStarLevel] || 10) + (stars - 1) * 2;
        });
        
        return Math.floor(totalDamage);
    }
}

// PVE 크립 생성
function generateCreeps(round) {
    const creeps = [];
    
    // 라운드별 크립 설정 (점진적 난이도 증가)
    let creepCount, baseHp, baseDamage, creepName;
    
    if (round === 1) {
        creepCount = 1;
        baseHp = 250;
        baseDamage = 25;
        creepName = '적 훈련병';
    } else if (round === 2) {
        creepCount = 2;
        baseHp = 350;
        baseDamage = 30;
        creepName = '적 훈련병';
    } else if (round === 3) {
        creepCount = 2;
        baseHp = 500;
        baseDamage = 40;
        creepName = '적 일반병';
    } else if (round <= 10) {
        // 라운드 4-10
        creepCount = Math.min(2 + Math.floor(round / 2), 5);
        baseHp = 400 + (round - 3) * 100;
        baseDamage = 35 + (round - 3) * 10;
        creepName = '적 정예병';
    } else if (round <= 20) {
        // 라운드 11-20
        creepCount = Math.min(4 + Math.floor(round / 3), 6);
        baseHp = 1000 + (round - 10) * 150;
        baseDamage = 70 + (round - 10) * 15;
        creepName = '적 중대';
    } else {
        // 라운드 21+
        creepCount = Math.min(6 + Math.floor(round / 5), 8);
        baseHp = 2500 + (round - 20) * 250;
        baseDamage = 120 + (round - 20) * 20;
        creepName = '적 특수부대';
    }
    
    // 크립 생성
    for (let i = 0; i < creepCount; i++) {
        creeps.push({
            id: `creep_${round}_${i}`,
            name: creepName,
            cost: 0,
            tier: 1,
            traits: ['적군'],
            stats: {
                hp: baseHp,
                mana: 0,
                maxMana: 999,
                attackDamage: baseDamage,
                armor: 15 + round * 3,
                magicResist: 15 + round * 3,
                attackSpeed: 0.6,
                attackRange: 1,
                movementSpeed: 1
            },
            skill: null, // 크립은 스킬 없음
            position: {
                x: i % 7,
                y: Math.floor(i / 7)
            }
        });
    }
    
    return creeps;
}

// 전투 시뮬레이션 (빠른 결과 계산용)
function simulateBattle(team1, team2) {
    const battle = new BattleSystem();
    return battle.startBattle(team1, team2);
}
