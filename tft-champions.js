// 11사단 기갑수색대대 보직 기반 챔피언 데이터
// 티어: 1코스트(일반병), 2코스트(특기/반장), 3코스트(분대장), 4코스트(소대장/중대장), 5코스트(대대장/특수)

const CHAMPIONS = [
    // ===== 1코스트 (일반 병사) =====
    {
        id: 'trainee_rifleman',
        name: '훈련병',
        cost: 1,
        tier: 1,
        role: 'dps',
        traits: ['보병', '신병'],
        stats: {
            hp: 500,
            mana: 0,
            maxMana: 50,
            attackDamage: 45,
            armor: 20,
            magicResist: 20,
            attackSpeed: 0.6,
            attackRange: 2,
            movementSpeed: 2
        },
        skill: {
            name: '제식훈련',
            description: '기본 공격력 50% 증가',
            manaCost: 50,
            effect: (unit, target, allies, enemies) => {
                unit.buffAttackDamage = unit.stats.attackDamage * 0.5;
                setTimeout(() => { unit.buffAttackDamage = 0; }, 4000);
            }
        }
    },
    {
        id: 'driver',
        name: '운전병',
        cost: 1,
        tier: 1,
        role: 'assassin',
        traits: ['경수색반', '기동'],
        stats: {
            hp: 550,
            mana: 0,
            maxMana: 60,
            attackDamage: 40,
            armor: 25,
            magicResist: 20,
            attackSpeed: 0.65,
            attackRange: 1,
            movementSpeed: 1.3
        },
        skill: {
            name: '긴급기동',
            description: '이동속도 200% 증가, 3초간',
            manaCost: 60,
            effect: (unit, target, allies, enemies) => {
                const originalSpeed = unit.stats.movementSpeed;
                unit.stats.movementSpeed *= 3;
                setTimeout(() => { unit.stats.movementSpeed = originalSpeed; }, 3000);
            }
        }
    },
    {
        id: 'mechanic',
        name: '정비병',
        cost: 1,
        tier: 1,
        role: 'support',
        traits: ['지원', '정비'],
        stats: {
            hp: 600,
            mana: 0,
            maxMana: 80,
            attackDamage: 35,
            armor: 30,
            magicResist: 20,
            attackSpeed: 0.5,
            attackRange: 1,
            movementSpeed: 0.9
        },
        skill: {
            name: '응급수리',
            description: '가장 가까운 아군 체력 200 회복',
            manaCost: 80,
            effect: (unit, target, allies, enemies) => {
                const nearestAlly = allies.filter(a => a.id !== unit.id).sort((a, b) => 
                    Math.hypot(a.x - unit.x, a.y - unit.y) - Math.hypot(b.x - unit.x, b.y - unit.y)
                )[0];
                if (nearestAlly) {
                    nearestAlly.currentHp = Math.min(nearestAlly.currentHp + 200, nearestAlly.stats.hp);
                }
            }
        }
    },
    {
        id: 'signalman',
        name: '통신병',
        cost: 1,
        tier: 1,
        role: 'support',
        traits: ['지원', '통신'],
        stats: {
            hp: 520,
            mana: 0,
            maxMana: 70,
            attackDamage: 38,
            armor: 22,
            magicResist: 25,
            attackSpeed: 0.55,
            attackRange: 2,
            movementSpeed: 1
        },
        skill: {
            name: '통신망 구축',
            description: '아군 전체 공격속도 20% 증가',
            manaCost: 70,
            effect: (unit, target, allies, enemies) => {
                allies.forEach(ally => {
                    const original = ally.stats.attackSpeed;
                    ally.stats.attackSpeed *= 1.2;
                    setTimeout(() => { ally.stats.attackSpeed = original; }, 4000);
                });
            }
        }
    },
    {
        id: 'medic',
        name: '의무병',
        cost: 1,
        tier: 1,
        role: 'support',
        traits: ['지원', '의무'],
        stats: {
            hp: 580,
            mana: 0,
            maxMana: 75,
            attackDamage: 30,
            armor: 25,
            magicResist: 30,
            attackSpeed: 0.5,
            attackRange: 2,
            movementSpeed: 1
        },
        skill: {
            name: '응급처치',
            description: '체력이 가장 낮은 아군 체력 250 회복',
            manaCost: 75,
            effect: (unit, target, allies, enemies) => {
                const lowestHpAlly = allies.sort((a, b) => 
                    (a.currentHp / a.stats.hp) - (b.currentHp / b.stats.hp)
                )[0];
                if (lowestHpAlly) {
                    lowestHpAlly.currentHp = Math.min(lowestHpAlly.currentHp + 250, lowestHpAlly.stats.hp);
                }
            }
        }
    },

    // ===== 2코스트 (특기병/반장급) =====
    {
        id: 'machine_gunner',
        name: '기관총병',
        cost: 2,
        tier: 2,
        role: 'dps',
        traits: ['화력지원', 'M60'],
        stats: {
            hp: 700,
            mana: 0,
            maxMana: 60,
            attackDamage: 65,
            armor: 30,
            magicResist: 25,
            attackSpeed: 0.85,
            attackRange: 3,
            movementSpeed: 0.8
        },
        skill: {
            name: 'M60 난사',
            description: '전방 3칸의 모든 적에게 150% 피해',
            manaCost: 60,
            effect: (unit, target, allies, enemies) => {
                enemies.forEach(enemy => {
                    const distance = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
                    if (distance <= 3) {
                        enemy.currentHp -= unit.stats.attackDamage * 1.5;
                    }
                });
            }
        }
    },
    {
        id: 'mechanized_infantry',
        name: '기계화 보병',
        cost: 2,
        tier: 2,
        role: 'tank',
        traits: ['기보', '보병'],
        stats: {
            hp: 850,
            mana: 0,
            maxMana: 70,
            attackDamage: 60,
            armor: 45,
            magicResist: 30,
            attackSpeed: 0.7,
            attackRange: 1,
            movementSpeed: 1.1
        },
        skill: {
            name: '장갑차 돌격',
            description: '돌진하여 200 피해 + 1초 기절',
            manaCost: 70,
            effect: (unit, target, allies, enemies) => {
                if (target) {
                    target.currentHp -= 200;
                    target.stunned = true;
                    setTimeout(() => { target.stunned = false; }, 1000);
                }
            }
        }
    },
    {
        id: 'gunner',
        name: '포수',
        cost: 2,
        tier: 2,
        role: 'dps',
        traits: ['화력지원', '지원반'],
        stats: {
            hp: 650,
            mana: 0,
            maxMana: 80,
            attackDamage: 120,
            armor: 25,
            magicResist: 25,
            attackSpeed: 0.5,
            attackRange: 4,
            movementSpeed: 0.8
        },
        skill: {
            name: '직사포격',
            description: '단일 대상에게 300% 피해',
            manaCost: 80,
            effect: (unit, target, allies, enemies) => {
                if (target) {
                    target.currentHp -= unit.stats.attackDamage * 3;
                }
            }
        }
    },
    {
        id: 'observer',
        name: '관측병',
        cost: 2,
        tier: 2,
        role: 'assassin',
        traits: ['지원반', '정찰'],
        stats: {
            hp: 620,
            mana: 0,
            maxMana: 65,
            attackDamage: 50,
            armor: 28,
            magicResist: 28,
            attackSpeed: 0.6,
            attackRange: 3,
            movementSpeed: 1.2
        },
        skill: {
            name: '표적지시',
            description: '아군 전체 명중률 30% 증가, 5초간',
            manaCost: 65,
            effect: (unit, target, allies, enemies) => {
                allies.forEach(ally => {
                    ally.accuracy = (ally.accuracy || 1) * 1.3;
                    setTimeout(() => { ally.accuracy = (ally.accuracy || 1) / 1.3; }, 5000);
                });
            }
        }
    },
    {
        id: 'calculator',
        name: '계산병',
        cost: 2,
        tier: 2,
        role: 'support',
        traits: ['지원반', '전술'],
        stats: {
            hp: 600,
            mana: 0,
            maxMana: 90,
            attackDamage: 40,
            armor: 25,
            magicResist: 30,
            attackSpeed: 0.5,
            attackRange: 3,
            movementSpeed: 1
        },
        skill: {
            name: '탄도계산',
            description: '아군 원거리 유닛 공격력 50% 증가',
            manaCost: 90,
            effect: (unit, target, allies, enemies) => {
                allies.filter(a => a.stats.attackRange >= 2).forEach(ally => {
                    ally.buffAttackDamage = (ally.buffAttackDamage || 0) + ally.stats.attackDamage * 0.5;
                    setTimeout(() => { 
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) - ally.stats.attackDamage * 0.5; 
                    }, 5000);
                });
            }
        }
    },
    {
        id: 'squad_leader',
        name: '경수색반장',
        cost: 2,
        tier: 2,
        role: 'support',
        traits: ['경수색반', '지휘관'],
        stats: {
            hp: 750,
            mana: 0,
            maxMana: 70,
            attackDamage: 70,
            armor: 35,
            magicResist: 30,
            attackSpeed: 0.75,
            attackRange: 2,
            movementSpeed: 1.2
        },
        skill: {
            name: '돌격명령',
            description: '경수색반 유닛 공격속도 50% 증가',
            manaCost: 70,
            effect: (unit, target, allies, enemies) => {
                allies.filter(a => a.traits.includes('경수색반')).forEach(ally => {
                    const original = ally.stats.attackSpeed;
                    ally.stats.attackSpeed *= 1.5;
                    setTimeout(() => { ally.stats.attackSpeed = original; }, 5000);
                });
            }
        }
    },
    {
        id: 'artillery_leader',
        name: '포반장',
        cost: 2,
        tier: 2,
        role: 'support',
        traits: ['지원반', '지휘관'],
        stats: {
            hp: 700,
            mana: 0,
            maxMana: 75,
            attackDamage: 80,
            armor: 32,
            magicResist: 28,
            attackSpeed: 0.65,
            attackRange: 3,
            movementSpeed: 0.9
        },
        skill: {
            name: '화력집중',
            description: '지원반 유닛 공격력 40% 증가',
            manaCost: 75,
            effect: (unit, target, allies, enemies) => {
                allies.filter(a => a.traits.includes('지원반')).forEach(ally => {
                    ally.buffAttackDamage = (ally.buffAttackDamage || 0) + ally.stats.attackDamage * 0.4;
                    setTimeout(() => { 
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) - ally.stats.attackDamage * 0.4; 
                    }, 5000);
                });
            }
        }
    },

    // ===== 3코스트 (분대장급/특수병) =====
    {
        id: 'scout_recon',
        name: '척후병',
        cost: 3,
        tier: 3,
        role: 'assassin',
        traits: ['경수색반', '특수전', 'M60'],
        stats: {
            hp: 900,
            mana: 0,
            maxMana: 80,
            attackDamage: 95,
            armor: 40,
            magicResist: 35,
            attackSpeed: 0.9,
            attackRange: 3,
            movementSpeed: 1.4
        },
        skill: {
            name: '화력유도',
            description: '전방 지역에 200 광역 피해 + 아군 공격력 30% 증가',
            manaCost: 80,
            effect: (unit, target, allies, enemies) => {
                // 광역 피해
                enemies.forEach(enemy => {
                    const distance = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
                    if (distance <= 2) {
                        enemy.currentHp -= 200;
                    }
                });
                // 아군 버프
                allies.forEach(ally => {
                    ally.buffAttackDamage = (ally.buffAttackDamage || 0) + ally.stats.attackDamage * 0.3;
                    setTimeout(() => { 
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) - ally.stats.attackDamage * 0.3; 
                    }, 4000);
                });
            }
        }
    },
    {
        id: 'heavy_gunner',
        name: '중화기병',
        cost: 3,
        tier: 3,
        role: 'dps',
        traits: ['중수색반', 'M60', '화력지원'],
        stats: {
            hp: 950,
            mana: 0,
            maxMana: 85,
            attackDamage: 110,
            armor: 45,
            magicResist: 35,
            attackSpeed: 0.75,
            attackRange: 3,
            movementSpeed: 0.7
        },
        skill: {
            name: '제압사격',
            description: '3x3 범위에 80 피해/초, 3초간',
            manaCost: 85,
            effect: (unit, target, allies, enemies) => {
                let ticks = 0;
                const interval = setInterval(() => {
                    enemies.forEach(enemy => {
                        const distance = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
                        if (distance <= 3) {
                            enemy.currentHp -= 80;
                        }
                    });
                    ticks++;
                    if (ticks >= 3) clearInterval(interval);
                }, 1000);
            }
        }
    },
    {
        id: 'anti_tank',
        name: '대전차병',
        cost: 3,
        tier: 3,
        role: 'dps',
        traits: ['기보', '대전차'],
        stats: {
            hp: 800,
            mana: 0,
            maxMana: 90,
            attackDamage: 150,
            armor: 35,
            magicResist: 30,
            attackSpeed: 0.5,
            attackRange: 3,
            movementSpeed: 0.9
        },
        skill: {
            name: '대전차 미사일',
            description: '단일 대상 500 피해 (기갑에 2배)',
            manaCost: 90,
            effect: (unit, target, allies, enemies) => {
                if (target) {
                    let damage = 500;
                    if (target.traits.includes('기갑')) damage *= 2;
                    target.currentHp -= damage;
                }
            }
        }
    },
    {
        id: 'mech_squad_leader',
        name: '기보분대장',
        cost: 3,
        tier: 3,
        role: 'support',
        traits: ['기보', '지휘관'],
        stats: {
            hp: 1100,
            mana: 0,
            maxMana: 75,
            attackDamage: 85,
            armor: 55,
            magicResist: 40,
            attackSpeed: 0.7,
            attackRange: 1,
            movementSpeed: 1.1
        },
        skill: {
            name: '기갑돌격 지시',
            description: '기보 유닛 방어력 +50, 공격력 +30%',
            manaCost: 75,
            effect: (unit, target, allies, enemies) => {
                allies.filter(a => a.traits.includes('기보')).forEach(ally => {
                    ally.stats.armor += 50;
                    ally.buffAttackDamage = (ally.buffAttackDamage || 0) + ally.stats.attackDamage * 0.3;
                    setTimeout(() => { 
                        ally.stats.armor -= 50;
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) - ally.stats.attackDamage * 0.3; 
                    }, 6000);
                });
            }
        }
    },
    {
        id: 'recon_squad_leader',
        name: '수색분대장',
        cost: 3,
        tier: 3,
        role: 'support',
        traits: ['경수색반', '지휘관', '특수전'],
        stats: {
            hp: 950,
            mana: 0,
            maxMana: 70,
            attackDamage: 90,
            armor: 42,
            magicResist: 38,
            attackSpeed: 0.8,
            attackRange: 2,
            movementSpeed: 1.3
        },
        skill: {
            name: '작전지시',
            description: '경수색반 모든 스탯 25% 증가',
            manaCost: 70,
            effect: (unit, target, allies, enemies) => {
                allies.filter(a => a.traits.includes('경수색반')).forEach(ally => {
                    const buffs = {
                        ad: ally.stats.attackDamage * 0.25,
                        armor: ally.stats.armor * 0.25,
                        as: ally.stats.attackSpeed * 0.25
                    };
                    ally.buffAttackDamage = (ally.buffAttackDamage || 0) + buffs.ad;
                    ally.stats.armor += buffs.armor;
                    ally.stats.attackSpeed += buffs.as;
                    setTimeout(() => { 
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) - buffs.ad;
                        ally.stats.armor -= buffs.armor;
                        ally.stats.attackSpeed -= buffs.as;
                    }, 6000);
                });
            }
        }
    },
    {
        id: 'engineer',
        name: '공병',
        cost: 3,
        tier: 3,
        role: 'support',
        traits: ['지원', '공병'],
        stats: {
            hp: 1000,
            mana: 0,
            maxMana: 100,
            attackDamage: 70,
            armor: 50,
            magicResist: 40,
            attackSpeed: 0.6,
            attackRange: 2,
            movementSpeed: 0.9
        },
        skill: {
            name: 'C4 폭파',
            description: '2x2 범위 400 피해 + 아군에게 방어막 200',
            manaCost: 100,
            effect: (unit, target, allies, enemies) => {
                enemies.forEach(enemy => {
                    const distance = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
                    if (distance <= 2) {
                        enemy.currentHp -= 400;
                    }
                });
                allies.forEach(ally => {
                    ally.shield = (ally.shield || 0) + 200;
                });
            }
        }
    },

    // ===== 4코스트 (소대장/중대장급) =====
    {
        id: 'tank_gunner',
        name: 'K-1 포수',
        cost: 4,
        tier: 4,
        role: 'tank',
        traits: ['중수색반', '기갑', '화력지원'],
        stats: {
            hp: 1400,
            mana: 0,
            maxMana: 100,
            attackDamage: 180,
            armor: 80,
            magicResist: 50,
            attackSpeed: 0.5,
            attackRange: 4,
            movementSpeed: 0.6
        },
        skill: {
            name: '105mm 주포 사격',
            description: '직선상 모든 적에게 600 피해',
            manaCost: 100,
            effect: (unit, target, allies, enemies) => {
                enemies.forEach(enemy => {
                    // 직선 판정 (각도 계산)
                    const angle = Math.atan2(enemy.y - unit.y, enemy.x - unit.x);
                    const targetAngle = Math.atan2(target.y - unit.y, target.x - unit.x);
                    if (Math.abs(angle - targetAngle) < 0.3) {
                        enemy.currentHp -= 600;
                    }
                });
            }
        }
    },
    {
        id: 'tank_driver',
        name: 'K-1 조종수',
        cost: 4,
        tier: 4,
        role: 'tank',
        traits: ['중수색반', '기갑', '기동'],
        stats: {
            hp: 1600,
            mana: 0,
            maxMana: 80,
            attackDamage: 100,
            armor: 100,
            magicResist: 60,
            attackSpeed: 0.6,
            attackRange: 1,
            movementSpeed: 1
        },
        skill: {
            name: '전차 돌격',
            description: '돌진하여 경로상 모든 적 300 피해 + 2초 기절',
            manaCost: 80,
            effect: (unit, target, allies, enemies) => {
                enemies.forEach(enemy => {
                    const distance = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
                    if (distance <= 2) {
                        enemy.currentHp -= 300;
                        enemy.stunned = true;
                        setTimeout(() => { enemy.stunned = false; }, 2000);
                    }
                });
            }
        }
    },
    {
        id: 'platoon_leader',
        name: '소대장',
        cost: 4,
        tier: 4,
        role: 'support',
        traits: ['지휘관', '장교'],
        stats: {
            hp: 1200,
            mana: 0,
            maxMana: 90,
            attackDamage: 100,
            armor: 60,
            magicResist: 60,
            attackSpeed: 0.7,
            attackRange: 2,
            movementSpeed: 1.1
        },
        skill: {
            name: '전술지휘',
            description: '아군 전체 공격력 +40%, 공격속도 +30%',
            manaCost: 90,
            effect: (unit, target, allies, enemies) => {
                allies.forEach(ally => {
                    const buffs = {
                        ad: ally.stats.attackDamage * 0.4,
                        as: ally.stats.attackSpeed * 0.3
                    };
                    ally.buffAttackDamage = (ally.buffAttackDamage || 0) + buffs.ad;
                    ally.stats.attackSpeed += buffs.as;
                    setTimeout(() => { 
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) - buffs.ad;
                        ally.stats.attackSpeed -= buffs.as;
                    }, 7000);
                });
            }
        }
    },
    {
        id: 'company_commander',
        name: '중대장',
        cost: 4,
        tier: 4,
        role: 'support',
        traits: ['지휘관', '장교'],
        stats: {
            hp: 1300,
            mana: 0,
            maxMana: 100,
            attackDamage: 110,
            armor: 65,
            magicResist: 65,
            attackSpeed: 0.75,
            attackRange: 2,
            movementSpeed: 1.1
        },
        skill: {
            name: '중대 작전명령',
            description: '아군 전체 모든 스탯 35% 증가 + 300 보호막',
            manaCost: 100,
            effect: (unit, target, allies, enemies) => {
                allies.forEach(ally => {
                    const buffs = {
                        ad: ally.stats.attackDamage * 0.35,
                        armor: ally.stats.armor * 0.35,
                        mr: ally.stats.magicResist * 0.35,
                        as: ally.stats.attackSpeed * 0.35
                    };
                    ally.buffAttackDamage = (ally.buffAttackDamage || 0) + buffs.ad;
                    ally.stats.armor += buffs.armor;
                    ally.stats.magicResist += buffs.mr;
                    ally.stats.attackSpeed += buffs.as;
                    ally.shield = (ally.shield || 0) + 300;
                    setTimeout(() => { 
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) - buffs.ad;
                        ally.stats.armor -= buffs.armor;
                        ally.stats.magicResist -= buffs.mr;
                        ally.stats.attackSpeed -= buffs.as;
                    }, 8000);
                });
            }
        }
    },
    {
        id: 'sniper',
        name: '저격수',
        cost: 4,
        tier: 4,
        role: 'assassin',
        traits: ['특수전', '정찰'],
        stats: {
            hp: 850,
            mana: 0,
            maxMana: 120,
            attackDamage: 250,
            armor: 30,
            magicResist: 30,
            attackSpeed: 0.4,
            attackRange: 6,
            movementSpeed: 1
        },
        skill: {
            name: '정밀사격',
            description: '가장 먼 적에게 1000 피해',
            manaCost: 120,
            effect: (unit, target, allies, enemies) => {
                const farthest = enemies.sort((a, b) => 
                    Math.hypot(b.x - unit.x, b.y - unit.y) - Math.hypot(a.x - unit.x, a.y - unit.y)
                )[0];
                if (farthest) {
                    farthest.currentHp -= 1000;
                }
            }
        }
    },

    // ===== 5코스트 (대대장/최고급) =====
    {
        id: 'battalion_commander',
        name: '대대장',
        cost: 5,
        tier: 5,
        role: 'support',
        traits: ['지휘관', '장교', '전설'],
        stats: {
            hp: 1800,
            mana: 0,
            maxMana: 120,
            attackDamage: 150,
            armor: 80,
            magicResist: 80,
            attackSpeed: 0.8,
            attackRange: 2,
            movementSpeed: 1.2
        },
        skill: {
            name: '대대 총공세',
            description: '아군 전체 공격력 +60%, 방어력 +50, 공격속도 +50%',
            manaCost: 120,
            effect: (unit, target, allies, enemies) => {
                allies.forEach(ally => {
                    const buffs = {
                        ad: ally.stats.attackDamage * 0.6,
                        as: ally.stats.attackSpeed * 0.5
                    };
                    ally.buffAttackDamage = (ally.buffAttackDamage || 0) + buffs.ad;
                    ally.stats.armor += 50;
                    ally.stats.attackSpeed += buffs.as;
                    setTimeout(() => { 
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) - buffs.ad;
                        ally.stats.armor -= 50;
                        ally.stats.attackSpeed -= buffs.as;
                    }, 10000);
                });
            }
        }
    },
    {
        id: 'special_forces_leader',
        name: '특전사령관',
        cost: 5,
        tier: 5,
        role: 'support',
        traits: ['특수전', '지휘관', '전설'],
        stats: {
            hp: 1400,
            mana: 0,
            maxMana: 100,
            attackDamage: 200,
            armor: 60,
            magicResist: 60,
            attackSpeed: 1.2,
            attackRange: 2,
            movementSpeed: 1.5
        },
        skill: {
            name: '특수작전 개시',
            description: '적 후방으로 순간이동 + 가장 약한 적 즉사',
            manaCost: 100,
            effect: (unit, target, allies, enemies) => {
                const weakest = enemies.sort((a, b) => a.currentHp - b.currentHp)[0];
                if (weakest && weakest.currentHp < 500) {
                    weakest.currentHp = 0;
                } else if (weakest) {
                    weakest.currentHp -= 800;
                }
                // 순간이동 효과
                if (target) {
                    unit.x = target.x;
                    unit.y = target.y;
                }
            }
        }
    },
    {
        id: 'master_sergeant',
        name: '원사',
        cost: 5,
        tier: 5,
        role: 'support',
        traits: ['지휘관', '부사관', '전설'],
        stats: {
            hp: 2000,
            mana: 0,
            maxMana: 110,
            attackDamage: 140,
            armor: 90,
            magicResist: 70,
            attackSpeed: 0.75,
            attackRange: 1,
            movementSpeed: 1.1
        },
        skill: {
            name: '불굴의 의지',
            description: '아군 전체 최대 체력 +30%, 5초간 무적',
            manaCost: 110,
            effect: (unit, target, allies, enemies) => {
                allies.forEach(ally => {
                    ally.stats.hp *= 1.3;
                    ally.currentHp *= 1.3;
                    ally.invincible = true;
                    setTimeout(() => { 
                        ally.invincible = false;
                    }, 5000);
                });
            }
        }
    },
    {
        id: 'k2_tank_commander',
        name: 'K-2 전차장',
        cost: 5,
        tier: 5,
        role: 'tank',
        traits: ['기갑', '중수색반', '전설'],
        stats: {
            hp: 2200,
            mana: 0,
            maxMana: 130,
            attackDamage: 250,
            armor: 120,
            magicResist: 80,
            attackSpeed: 0.6,
            attackRange: 5,
            movementSpeed: 0.8
        },
        skill: {
            name: '120mm 스마트포탄',
            description: '전체 적에게 400 피해 + 4초 화상',
            manaCost: 130,
            effect: (unit, target, allies, enemies) => {
                enemies.forEach(enemy => {
                    enemy.currentHp -= 400;
                    // 화상 효과
                    let ticks = 0;
                    const burnInterval = setInterval(() => {
                        enemy.currentHp -= 50;
                        ticks++;
                        if (ticks >= 4) clearInterval(burnInterval);
                    }, 1000);
                });
            }
        }
    },
    {
        id: 'artillery_commander',
        name: '포병대대장',
        cost: 5,
        tier: 5,
        role: 'support',
        traits: ['화력지원', '지휘관', '전설'],
        stats: {
            hp: 1500,
            mana: 0,
            maxMana: 140,
            attackDamage: 180,
            armor: 70,
            magicResist: 70,
            attackSpeed: 0.5,
            attackRange: 6,
            movementSpeed: 0.8
        },
        skill: {
            name: '화력집중포격',
            description: '전장 전체에 500 피해 + 적 방어력 50% 감소',
            manaCost: 140,
            effect: (unit, target, allies, enemies) => {
                enemies.forEach(enemy => {
                    enemy.currentHp -= 500;
                    const armorReduction = enemy.stats.armor * 0.5;
                    enemy.stats.armor -= armorReduction;
                    setTimeout(() => { 
                        enemy.stats.armor += armorReduction;
                    }, 6000);
                });
            }
        }
    }
];

// 챔피언 ID로 찾기
function getChampionById(id) {
    return CHAMPIONS.find(c => c.id === id);
}

// 코스트로 챔피언 필터링
function getChampionsByCost(cost) {
    return CHAMPIONS.filter(c => c.cost === cost);
}

// 특성으로 챔피언 필터링
function getChampionsByTrait(trait) {
    return CHAMPIONS.filter(c => c.traits.includes(trait));
}
