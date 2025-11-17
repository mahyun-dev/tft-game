// 11사단 기갑수색대대 시너지 시스템
// 롤토체스 스타일의 시너지 효과

const SYNERGIES = {
    // ===== 부대별 시너지 =====
    '경수색반': {
        name: '경수색반',
        description: '전방 정찰 및 기동타격',
        tiers: [
            {
                count: 2,
                effect: '이동속도 +15%, 공격속도 +15%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.movementSpeed *= 1.15;
                        u.stats.attackSpeed *= 1.15;
                    });
                }
            },
            {
                count: 4,
                effect: '이동속도 +30%, 공격속도 +30%, 회피율 +20%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.movementSpeed *= 1.3;
                        u.stats.attackSpeed *= 1.3;
                        u.evasion = (u.evasion || 0) + 0.2;
                    });
                }
            },
            {
                count: 6,
                effect: '이동속도 +50%, 공격속도 +50%, 회피율 +35%, 첫 공격 2배 피해',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.movementSpeed *= 1.5;
                        u.stats.attackSpeed *= 1.5;
                        u.evasion = (u.evasion || 0) + 0.35;
                        u.firstStrikeDamage = 2;
                    });
                }
            }
        ]
    },

    '중수색반': {
        name: '중수색반',
        description: 'K-1 전차 중심의 중화력 수색',
        tiers: [
            {
                count: 2,
                effect: '방어력 +30, 공격력 +20%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.armor += 30;
                        u.buffAttackDamage = (u.buffAttackDamage || 0) + u.stats.attackDamage * 0.2;
                    });
                }
            },
            {
                count: 3,
                effect: '방어력 +60, 공격력 +40%, 피해감소 15%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.armor += 60;
                        u.buffAttackDamage = (u.buffAttackDamage || 0) + u.stats.attackDamage * 0.4;
                        u.damageReduction = (u.damageReduction || 0) + 0.15;
                    });
                }
            },
            {
                count: 4,
                effect: '방어력 +100, 공격력 +70%, 피해감소 30%, 광역 피해',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.armor += 100;
                        u.buffAttackDamage = (u.buffAttackDamage || 0) + u.stats.attackDamage * 0.7;
                        u.damageReduction = (u.damageReduction || 0) + 0.3;
                        u.splashDamage = 0.3;
                    });
                }
            }
        ]
    },

    '기보': {
        name: '기보 (기계화보병)',
        description: '장갑차 기반 돌격부대',
        tiers: [
            {
                count: 2,
                effect: '체력 +200, 방어력 +25',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.hp += 200;
                        u.currentHp += 200;
                        u.stats.armor += 25;
                    });
                }
            },
            {
                count: 4,
                effect: '체력 +450, 방어력 +50, 전투 시작 시 보호막 300',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.hp += 450;
                        u.currentHp += 450;
                        u.stats.armor += 50;
                        u.shield = (u.shield || 0) + 300;
                    });
                }
            },
            {
                count: 6,
                effect: '체력 +800, 방어력 +80, 보호막 600, 공격 시 25% 확률로 기절',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.hp += 800;
                        u.currentHp += 800;
                        u.stats.armor += 80;
                        u.shield = (u.shield || 0) + 600;
                        u.stunChance = 0.25;
                    });
                }
            }
        ]
    },

    '화력지원': {
        name: '화력지원',
        description: '포병 및 중화기 화력',
        tiers: [
            {
                count: 2,
                effect: '공격력 +25%, 사거리 +1',
                bonus: (units) => {
                    units.forEach(u => {
                        u.buffAttackDamage = (u.buffAttackDamage || 0) + u.stats.attackDamage * 0.25;
                        u.stats.attackRange += 1;
                    });
                }
            },
            {
                count: 4,
                effect: '공격력 +50%, 사거리 +2, 스킬 피해 +30%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.buffAttackDamage = (u.buffAttackDamage || 0) + u.stats.attackDamage * 0.5;
                        u.stats.attackRange += 2;
                        u.skillDamageBonus = (u.skillDamageBonus || 1) * 1.3;
                    });
                }
            },
            {
                count: 6,
                effect: '공격력 +90%, 사거리 +3, 스킬 피해 +60%, 관통 공격',
                bonus: (units) => {
                    units.forEach(u => {
                        u.buffAttackDamage = (u.buffAttackDamage || 0) + u.stats.attackDamage * 0.9;
                        u.stats.attackRange += 3;
                        u.skillDamageBonus = (u.skillDamageBonus || 1) * 1.6;
                        u.pierce = true;
                    });
                }
            }
        ]
    },

    '지원반': {
        name: '지원반 (포반)',
        description: '포반의 정밀 화력지원',
        tiers: [
            {
                count: 2,
                effect: '스킬 마나 감소 -10',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.maxMana = Math.max(20, u.stats.maxMana - 10);
                    });
                }
            },
            {
                count: 3,
                effect: '스킬 마나 감소 -25, 스킬 피해 +40%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.maxMana = Math.max(20, u.stats.maxMana - 25);
                        u.skillDamageBonus = (u.skillDamageBonus || 1) * 1.4;
                    });
                }
            },
            {
                count: 4,
                effect: '스킬 마나 감소 -40, 스킬 피해 +80%, 아군 전체 스킬 피해 +20%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.maxMana = Math.max(20, u.stats.maxMana - 40);
                        u.skillDamageBonus = (u.skillDamageBonus || 1) * 1.8;
                    });
                }
            }
        ]
    },

    // ===== 병과별 시너지 =====
    '기갑': {
        name: '기갑',
        description: '전차 및 장갑차량',
        tiers: [
            {
                count: 2,
                effect: '방어력 +50, 피해감소 10%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.armor += 50;
                        u.damageReduction = (u.damageReduction || 0) + 0.1;
                    });
                }
            },
            {
                count: 4,
                effect: '방어력 +120, 피해감소 25%, 공격 시 30% 광역 피해',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.armor += 120;
                        u.damageReduction = (u.damageReduction || 0) + 0.25;
                        u.splashDamage = 0.3;
                    });
                }
            }
        ]
    },

    '보병': {
        name: '보병',
        description: '기본 전투병력',
        tiers: [
            {
                count: 2,
                effect: '체력 +150',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.hp += 150;
                        u.currentHp += 150;
                    });
                }
            },
            {
                count: 4,
                effect: '체력 +350, 공격력 +20%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.hp += 350;
                        u.currentHp += 350;
                        u.buffAttackDamage = (u.buffAttackDamage || 0) + u.stats.attackDamage * 0.2;
                    });
                }
            },
            {
                count: 6,
                effect: '체력 +600, 공격력 +40%, 방어력 +30',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.hp += 600;
                        u.currentHp += 600;
                        u.buffAttackDamage = (u.buffAttackDamage || 0) + u.stats.attackDamage * 0.4;
                        u.stats.armor += 30;
                    });
                }
            }
        ]
    },

    '지원': {
        name: '지원',
        description: '정비/통신/의무 지원병력',
        tiers: [
            {
                count: 2,
                effect: '아군 전체 초당 체력 20 회복',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.hpRegen = (ally.hpRegen || 0) + 20;
                    });
                }
            },
            {
                count: 3,
                effect: '아군 전체 초당 체력 40 회복 + 마나 5 회복',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.hpRegen = (ally.hpRegen || 0) + 40;
                        ally.manaRegen = (ally.manaRegen || 0) + 5;
                    });
                }
            },
            {
                count: 4,
                effect: '아군 전체 초당 체력 70 회복 + 마나 10 회복 + 부활 1회',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.hpRegen = (ally.hpRegen || 0) + 70;
                        ally.manaRegen = (ally.manaRegen || 0) + 10;
                        ally.revive = true;
                    });
                }
            }
        ]
    },

    'M60': {
        name: 'M60 기관총',
        description: 'M60 기관총 운용',
        tiers: [
            {
                count: 2,
                effect: '공격속도 +30%, 치명타 확률 +15%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.attackSpeed *= 1.3;
                        u.critChance = (u.critChance || 0) + 0.15;
                    });
                }
            },
            {
                count: 3,
                effect: '공격속도 +60%, 치명타 확률 +30%, 제압 효과',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.attackSpeed *= 1.6;
                        u.critChance = (u.critChance || 0) + 0.3;
                        u.suppress = true; // 공격 시 적 공격속도 감소
                    });
                }
            }
        ]
    },

    // ===== 특수 시너지 =====
    '지휘관': {
        name: '지휘관',
        description: '부대 지휘 능력',
        tiers: [
            {
                count: 1,
                effect: '아군 전체 공격력 +10%',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) + ally.stats.attackDamage * 0.1;
                    });
                }
            },
            {
                count: 2,
                effect: '아군 전체 공격력 +20%, 공격속도 +15%',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) + ally.stats.attackDamage * 0.2;
                        ally.stats.attackSpeed *= 1.15;
                    });
                }
            },
            {
                count: 3,
                effect: '아군 전체 공격력 +35%, 공격속도 +25%, 방어력 +30',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) + ally.stats.attackDamage * 0.35;
                        ally.stats.attackSpeed *= 1.25;
                        ally.stats.armor += 30;
                    });
                }
            },
            {
                count: 4,
                effect: '아군 전체 모든 스탯 +50%',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.buffAttackDamage = (ally.buffAttackDamage || 0) + ally.stats.attackDamage * 0.5;
                        ally.stats.attackSpeed *= 1.5;
                        ally.stats.armor *= 1.5;
                        ally.stats.magicResist *= 1.5;
                        ally.stats.hp *= 1.5;
                        ally.currentHp *= 1.5;
                    });
                }
            }
        ]
    },

    '특수전': {
        name: '특수전',
        description: '특수부대 작전능력',
        tiers: [
            {
                count: 2,
                effect: '치명타 확률 +30%, 치명타 피해 +50%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.critChance = (u.critChance || 0) + 0.3;
                        u.critDamage = (u.critDamage || 1.5) + 0.5;
                    });
                }
            },
            {
                count: 3,
                effect: '치명타 확률 +50%, 치명타 피해 +100%, 회피 +20%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.critChance = (u.critChance || 0) + 0.5;
                        u.critDamage = (u.critDamage || 1.5) + 1.0;
                        u.evasion = (u.evasion || 0) + 0.2;
                    });
                }
            },
            {
                count: 4,
                effect: '모든 공격이 치명타, 치명타 피해 +150%, 회피 +35%, 은신',
                bonus: (units) => {
                    units.forEach(u => {
                        u.critChance = 1;
                        u.critDamage = (u.critDamage || 1.5) + 1.5;
                        u.evasion = (u.evasion || 0) + 0.35;
                        u.stealth = true; // 첫 공격 전까지 타겟 안됨
                    });
                }
            }
        ]
    },

    '대전차': {
        name: '대전차',
        description: '대전차 화기 운용',
        tiers: [
            {
                count: 1,
                effect: '기갑 유닛에게 피해 +100%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.antiArmor = 2;
                    });
                }
            },
            {
                count: 2,
                effect: '기갑 유닛에게 피해 +200%, 방어력 무시 50%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.antiArmor = 3;
                        u.armorPenetration = 0.5;
                    });
                }
            }
        ]
    },

    '정찰': {
        name: '정찰',
        description: '정찰 및 관측',
        tiers: [
            {
                count: 2,
                effect: '시야 +2, 아군 회피 +10%',
                bonus: (units, allAllies) => {
                    units.forEach(u => {
                        u.visionRange = (u.visionRange || 3) + 2;
                    });
                    allAllies.forEach(ally => {
                        ally.evasion = (ally.evasion || 0) + 0.1;
                    });
                }
            },
            {
                count: 3,
                effect: '시야 +4, 아군 회피 +20%, 적 회피 무시',
                bonus: (units, allAllies) => {
                    units.forEach(u => {
                        u.visionRange = (u.visionRange || 3) + 4;
                        u.trueStrike = true; // 적 회피 무시
                    });
                    allAllies.forEach(ally => {
                        ally.evasion = (ally.evasion || 0) + 0.2;
                    });
                }
            }
        ]
    },

    '기동': {
        name: '기동',
        description: '빠른 기동력',
        tiers: [
            {
                count: 2,
                effect: '이동속도 +25%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.movementSpeed *= 1.25;
                    });
                }
            },
            {
                count: 4,
                effect: '이동속도 +50%, 전투 시작 시 전방 이동',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.movementSpeed *= 1.5;
                        u.startForward = true;
                    });
                }
            }
        ]
    },

    // ===== 계급/신분 시너지 =====
    '장교': {
        name: '장교',
        description: '간부 지휘능력',
        tiers: [
            {
                count: 1,
                effect: '아군 전체 최대 마나 -10',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.stats.maxMana = Math.max(20, ally.stats.maxMana - 10);
                    });
                }
            },
            {
                count: 2,
                effect: '아군 전체 최대 마나 -20, 스킬 피해 +25%',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.stats.maxMana = Math.max(20, ally.stats.maxMana - 20);
                        ally.skillDamageBonus = (ally.skillDamageBonus || 1) * 1.25;
                    });
                }
            }
        ]
    },

    '부사관': {
        name: '부사관',
        description: '실무 지휘능력',
        tiers: [
            {
                count: 1,
                effect: '아군 전체 체력 +100, 방어력 +10',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.stats.hp += 100;
                        ally.currentHp += 100;
                        ally.stats.armor += 10;
                    });
                }
            },
            {
                count: 2,
                effect: '아군 전체 체력 +250, 방어력 +25, 체력 50% 이하 시 피해 +30%',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.stats.hp += 250;
                        ally.currentHp += 250;
                        ally.stats.armor += 25;
                        ally.enrage = 0.3; // 체력 50% 이하 시 공격력 증가
                    });
                }
            }
        ]
    },

    '전설': {
        name: '전설',
        description: '전설적인 전투력',
        tiers: [
            {
                count: 1,
                effect: '모든 스탯 +25%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.hp *= 1.25;
                        u.currentHp *= 1.25;
                        u.buffAttackDamage = (u.buffAttackDamage || 0) + u.stats.attackDamage * 0.25;
                        u.stats.armor *= 1.25;
                        u.stats.magicResist *= 1.25;
                        u.stats.attackSpeed *= 1.25;
                    });
                }
            }
        ]
    },

    '신병': {
        name: '신병',
        description: '신임 병사',
        tiers: [
            {
                count: 3,
                effect: '체력 +200, 사망 시 50% 확률로 부활',
                bonus: (units) => {
                    units.forEach(u => {
                        u.stats.hp += 200;
                        u.currentHp += 200;
                        u.reviveChance = 0.5;
                    });
                }
            }
        ]
    },

    // ===== 기타 특수 시너지 =====
    '통신': {
        name: '통신',
        description: '통신망 구축',
        tiers: [
            {
                count: 2,
                effect: '아군 마나 회복 +5/초',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.manaRegen = (ally.manaRegen || 0) + 5;
                    });
                }
            }
        ]
    },

    '정비': {
        name: '정비',
        description: '장비 정비 및 수리',
        tiers: [
            {
                count: 2,
                effect: '아군 방어력 +20, 피해 받을 때 10% 무효화',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.stats.armor += 20;
                        ally.blockChance = (ally.blockChance || 0) + 0.1;
                    });
                }
            }
        ]
    },

    '의무': {
        name: '의무',
        description: '의무 지원',
        tiers: [
            {
                count: 2,
                effect: '아군 체력 회복 +30/초, 디버프 면역',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.hpRegen = (ally.hpRegen || 0) + 30;
                        ally.debuffImmune = true;
                    });
                }
            }
        ]
    },

    '공병': {
        name: '공병',
        description: '공병 지원',
        tiers: [
            {
                count: 2,
                effect: '전투 시작 시 아군에게 보호막 250',
                bonus: (units, allAllies) => {
                    allAllies.forEach(ally => {
                        ally.shield = (ally.shield || 0) + 250;
                    });
                }
            }
        ]
    },

    '전술': {
        name: '전술',
        description: '전술 운용',
        tiers: [
            {
                count: 2,
                effect: '스킬 효과 범위 +30%',
                bonus: (units) => {
                    units.forEach(u => {
                        u.skillRangeBonus = 1.3;
                    });
                }
            }
        ]
    }
};

// 시너지 계산 함수
function calculateSynergies(units) {
    const traitCounts = {};
    const activeSynergies = [];

    // 특성 개수 카운트
    units.forEach(unit => {
        if (unit.traits) {
            unit.traits.forEach(trait => {
                traitCounts[trait] = (traitCounts[trait] || 0) + 1;
            });
        }
    });

    // 활성화된 시너지 찾기
    Object.keys(traitCounts).forEach(trait => {
        const synergy = SYNERGIES[trait];
        if (synergy) {
            const count = traitCounts[trait];
            // 활성화된 가장 높은 티어 찾기
            const activeTier = synergy.tiers
                .filter(tier => count >= tier.count)
                .sort((a, b) => b.count - a.count)[0];
            
            if (activeTier) {
                activeSynergies.push({
                    name: synergy.name,
                    trait: trait,
                    count: count,
                    requiredCount: activeTier.count,
                    effect: activeTier.effect,
                    bonus: activeTier.bonus
                });
            }
        }
    });

    return { traitCounts, activeSynergies };
}

// 시너지 효과 적용
function applySynergies(units, allAllies = null) {
    // 유닛 복사 (원본 수정 방지)
    const unitsCopy = units.map(u => JSON.parse(JSON.stringify(u)));
    const allies = allAllies || units;
    const alliesCopy = allies.map(u => JSON.parse(JSON.stringify(u)));

    const { activeSynergies } = calculateSynergies(unitsCopy);

    activeSynergies.forEach(synergy => {
        const synergyUnits = unitsCopy.filter(u => u.traits && u.traits.includes(synergy.trait));
        synergy.bonus(synergyUnits, alliesCopy);
    });

    return { activeSynergies, unitsWithSynergies: unitsCopy };
}

// 시너지 적용된 유닛 스탯 계산 (표시용)
function getUnitStatsWithSynergies(unit, allUnits) {
    // 유닛 복사
    const tempUnit = JSON.parse(JSON.stringify(unit));
    // 전체 유닛 복사 (시너지 계산용, 원본 수정 방지)
    const allUnitsCopy = allUnits.map(u => JSON.parse(JSON.stringify(u)));

    // 기본 스탯으로 리셋 (아이템 효과 포함)
    tempUnit.stats = { ...tempUnit.baseStats } || { ...tempUnit.stats } || {
        hp: 100,
        attackDamage: 10,
        armor: 0,
        magicResist: 0,
        attackSpeed: 0.6,
        attackRange: 1,
        movementSpeed: 1
    };
    // 아이템 효과 재적용
    if (tempUnit.items) {
        tempUnit.items.forEach(item => {
            if (item.stats) {
                Object.keys(item.stats).forEach(stat => {
                    if (stat.includes('Multiplier')) {
                        const baseStat = stat.replace('Multiplier', '');
                        tempUnit.stats[baseStat] *= (1 + item.stats[stat]);
                    } else if (['critChance', 'evasion', 'lifesteal', 'damageReduction', 'thornsDamage'].includes(stat)) {
                        tempUnit[stat] = (tempUnit[stat] || 0) + item.stats[stat];
                    } else if (stat === 'hp') {
                        tempUnit.stats.hp += item.stats[stat];
                    } else {
                        tempUnit.stats[stat] = (tempUnit.stats[stat] || 0) + item.stats[stat];
                    }
                });
            }
            if (item.special) {
                tempUnit[item.special] = true;
            }
        });
    }

    // 시너지 적용
    const { activeSynergies } = calculateSynergies(allUnitsCopy);
    activeSynergies.forEach(synergy => {
        if (tempUnit.traits && tempUnit.traits.includes(synergy.trait)) {
            synergy.bonus([tempUnit], allUnitsCopy);
        }
    });

    // 버프 스탯 적용
    if (tempUnit.buffAttackDamage) {
        tempUnit.stats.attackDamage += tempUnit.buffAttackDamage;
    }
    if (tempUnit.buffHp) {
        tempUnit.stats.hp += tempUnit.buffHp;
    }

    return tempUnit.stats;
}
