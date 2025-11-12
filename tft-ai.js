// AI 플레이어 시스템
// 다양한 난이도의 AI 구현

// 유닛 복사 헬퍼 함수 (함수 보존)
function cloneUnitForAI(unit) {
    return {
        ...unit,
        stats: { ...unit.stats },
        traits: [...unit.traits],
        skill: unit.skill ? {
            name: unit.skill.name,
            description: unit.skill.description,
            manaCost: unit.skill.manaCost,
            effect: unit.skill.effect
        } : null,
        items: unit.items ? [...unit.items] : [],
        position: unit.position ? { ...unit.position } : null
    };
}

class AIPlayer {
    constructor(difficulty = 'normal') {
        this.difficulty = difficulty; // 'easy', 'normal', 'hard'
        this.gold = 0;
        this.level = 1;
        this.units = [];
        this.bench = [];
        this.health = 100;
        this.items = [];
        this.strategy = this.selectStrategy();
    }

    // 전략 선택
    selectStrategy() {
        const strategies = [
            '경수색반', // 빠른 공격
            '중수색반', // 탱커 중심
            '화력지원', // 원거리 딜러
            '기보', // 균형잡힌 조합
            '지휘관', // 버프 중심
            '특수전' // 암살자
        ];
        
        return strategies[Math.floor(Math.random() * strategies.length)];
    }

    // AI 턴 실행
    takeTurn(shop, round) {
        // 1. 레벨업 결정 (여러 번 시도 가능)
        let expBought = 0;
        while (expBought < 3 && this.decideLevelUp()) {
            expBought++;
        }
        
        // 2. 챔피언 구매
        this.buyChampions(shop);
        
        // 3. 챔피언 배치
        this.positionUnits();
        
        // 4. 아이템 장착
        this.equipItems();
        
        // 5. 리롤 결정
        if (this.shouldReroll(round)) {
            return 'reroll';
        }
    }

    // 레벨업 결정 (골드로 경험치 구매)
    decideLevelUp() {
        const expBuyCost = 4; // 경험치 구매 비용
        
        if (this.gold < expBuyCost) return false;
        
        // 현재 필요한 경험치
        if (!this.exp) this.exp = 0;
        const expToLevel = this.getExpToLevel(this.level);
        const expNeeded = expToLevel - this.exp;
        
        let shouldBuyExp = false;
        
        switch (this.difficulty) {
            case 'easy':
                // 쉬움: 보수적 (골드 50 이상, 레벨업 임박)
                shouldBuyExp = this.gold >= 50 && expNeeded <= 8 && this.level < 8;
                break;
                
            case 'normal':
                // 보통: 균형잡힌 경험치 구매
                if (this.level <= 4) {
                    shouldBuyExp = this.gold >= 20 && expNeeded <= 6;
                } else if (this.level <= 6) {
                    shouldBuyExp = this.gold >= 30 && expNeeded <= 8;
                } else {
                    shouldBuyExp = this.gold >= 40 && expNeeded <= 8;
                }
                break;
                
            case 'hard':
                // 어려움: 공격적 경험치 구매
                if (this.level <= 5) {
                    shouldBuyExp = this.gold >= 12; // 매우 빠른 레벨업
                } else if (this.level <= 7) {
                    shouldBuyExp = this.gold >= 20;
                } else {
                    shouldBuyExp = this.gold >= 30 && this.level < 9;
                }
                break;
        }
        
        if (shouldBuyExp && this.level < 9) {
            // 경험치 구매
            this.gold -= expBuyCost;
            this.exp += 4;
            
            // 레벨업 체크
            if (this.exp >= expToLevel) {
                this.exp -= expToLevel;
                this.level++;
                return true;
            }
        }
        
        return false;
    }
    
    // 레벨업 필요 경험치 계산
    getExpToLevel(level) {
        const expTable = {
            1: 2, 2: 2, 3: 6, 4: 10,
            5: 20, 6: 36, 7: 56, 8: 80
        };
        return expTable[level] || 999;
    }

    // 챔피언 구매
    buyChampions(shop) {
        if (!shop || shop.length === 0) return;
        
        // 전략에 맞는 챔피언 우선순위 결정
        const prioritizedShop = this.prioritizeChampions([...shop]); // 복사본 사용
        
        for (let champion of prioritizedShop) {
            // 골드 부족
            if (this.gold < champion.cost) continue;
            
            // 벤치 가득 참
            if (this.bench.length >= 9) break;
            
            // 구매 결정
            if (this.shouldBuyChampion(champion)) {
                this.gold -= champion.cost;
                const newUnit = cloneUnitForAI(champion);
                this.bench.push(newUnit);
                
                // 3스택 자동 업그레이드 체크
                this.checkUpgrades();
            }
        }
    }

    // 챔피언 우선순위
    prioritizeChampions(shop) {
        return shop.sort((a, b) => {
            let scoreA = this.evaluateChampion(a);
            let scoreB = this.evaluateChampion(b);
            return scoreB - scoreA;
        });
    }

    // 챔피언 평가
    evaluateChampion(champion) {
        let score = 0;
        
        // 전략 일치 보너스
        if (champion.traits.includes(this.strategy)) {
            score += 50;
        }
        
        // 현재 시너지와의 조합
        const currentTraits = {};
        [...this.units, ...this.bench].forEach(unit => {
            unit.traits.forEach(trait => {
                currentTraits[trait] = (currentTraits[trait] || 0) + 1;
            });
        });
        
        champion.traits.forEach(trait => {
            if (currentTraits[trait]) {
                score += currentTraits[trait] * 10;
            }
        });
        
        // 티어 점수
        score += (6 - champion.tier) * 5;
        
        // 난이도별 가중치
        switch (this.difficulty) {
            case 'easy':
                // 낮은 코스트 선호
                score += (6 - champion.cost) * 10;
                break;
            case 'hard':
                // 높은 코스트 선호 (후반)
                if (this.level >= 7) {
                    score += champion.cost * 15;
                }
                break;
        }
        
        // 중복 페널티 (이미 3성인 경우)
        const existing = [...this.units, ...this.bench].filter(u => u.id === champion.id);
        if (existing.length >= 9) {
            score -= 1000; // 더 이상 필요 없음
        } else if (existing.length >= 3 && existing.some(u => u.stars === 2)) {
            score -= 500;
        }
        
        return score;
    }

    // 구매 결정
    shouldBuyChampion(champion) {
        // 항상 전략 챔피언은 구매
        if (champion.traits.includes(this.strategy)) {
            return true;
        }
        
        // 코스트가 낮고 시너지가 있으면 구매
        const hasCommonTrait = champion.traits.some(trait => 
            [...this.units, ...this.bench].some(u => u.traits.includes(trait))
        );
        
        if (hasCommonTrait && champion.cost <= 3) {
            return true;
        }
        
        // 고급 유닛 (4-5 코스트)
        if (champion.cost >= 4) {
            // 레벨이 높고 골드가 충분하면 구매
            if (this.level >= 7 && this.gold >= champion.cost + 20) {
                return true;
            }
        }
        
        // 난이도별 확률
        const buyChance = {
            'easy': 0.3,
            'normal': 0.5,
            'hard': 0.7
        };
        
        return Math.random() < buyChance[this.difficulty];
    }

    // 3스택 업그레이드 체크
    checkUpgrades() {
        const championCounts = {};
        
        // 벤치와 필드의 모든 챔피언 카운트
        [...this.bench, ...this.units].forEach(unit => {
            const key = `${unit.id}_${unit.stars || 1}`;
            if (!championCounts[key]) {
                championCounts[key] = [];
            }
            championCounts[key].push(unit);
        });
        
        // 3개 이상인 경우 업그레이드
        Object.keys(championCounts).forEach(key => {
            const units = championCounts[key];
            if (units.length >= 3) {
                // 첫 번째 유닛을 업그레이드
                const upgraded = units[0];
                upgraded.stars = (upgraded.stars || 1) + 1;
                upgraded.stats.hp *= 1.8;
                upgraded.stats.attackDamage *= 1.8;
                upgraded.stats.armor *= 1.8;
                upgraded.stats.magicResist *= 1.8;
                
                // 나머지 2개 제거
                for (let i = 1; i <= 2; i++) {
                    const toRemove = units[i];
                    const benchIndex = this.bench.indexOf(toRemove);
                    if (benchIndex >= 0) {
                        this.bench.splice(benchIndex, 1);
                    } else {
                        const unitIndex = this.units.indexOf(toRemove);
                        if (unitIndex >= 0) {
                            this.units.splice(unitIndex, 1);
                        }
                    }
                }
            }
        });
    }

    // 유닛 배치
    positionUnits() {
        // 현재 필드 유닛들을 다시 벤치로 (위치 재조정을 위해)
        this.units.forEach(unit => {
            unit.position = null;
        });
        
        // 벤치와 필드 유닛을 모두 합침
        const allUnits = [...this.units, ...this.bench];
        
        // 초기화
        this.units = [];
        this.bench = [];
        
        // 레벨만큼 필드에 배치
        const toPlace = allUnits.slice(0, this.level);
        const remaining = allUnits.slice(this.level);
        
        // 포지션 전략
        const positions = this.getPositions();
        
        toPlace.forEach((unit, index) => {
            if (index < positions.length && index < this.level) {
                unit.position = positions[index];
                this.units.push(unit);
            }
        });
        
        // 나머지는 벤치로
        this.bench = remaining;
    }

    // 포지션 전략
    getPositions() {
        const positions = [];
        
        // 전략별 포지셔닝
        switch (this.strategy) {
            case '경수색반':
            case '특수전':
                // 양쪽 날개 배치 (빠른 진입)
                positions.push(
                    {x: 0, y: 0}, {x: 6, y: 0},
                    {x: 1, y: 0}, {x: 5, y: 0},
                    {x: 0, y: 1}, {x: 6, y: 1},
                    {x: 2, y: 0}, {x: 4, y: 0},
                    {x: 3, y: 0}
                );
                break;
                
            case '중수색반':
            case '기보':
                // 전방 탱커 라인
                positions.push(
                    {x: 3, y: 0}, {x: 2, y: 0}, {x: 4, y: 0},
                    {x: 1, y: 0}, {x: 5, y: 0},
                    {x: 3, y: 1}, {x: 2, y: 1}, {x: 4, y: 1},
                    {x: 0, y: 0}
                );
                break;
                
            case '화력지원':
                // 후방 딜러 라인
                positions.push(
                    {x: 3, y: 1}, {x: 2, y: 1}, {x: 4, y: 1},
                    {x: 1, y: 1}, {x: 5, y: 1},
                    {x: 3, y: 0}, {x: 2, y: 0}, {x: 4, y: 0},
                    {x: 0, y: 1}
                );
                break;
                
            default:
                // 균형 배치
                positions.push(
                    {x: 2, y: 0}, {x: 4, y: 0},
                    {x: 1, y: 1}, {x: 3, y: 1}, {x: 5, y: 1},
                    {x: 0, y: 0}, {x: 6, y: 0},
                    {x: 2, y: 1}, {x: 4, y: 1}
                );
        }
        
        return positions;
    }

    // 아이템 장착
    equipItems() {
        if (this.items.length === 0) return;
        
        // 아이템을 유닛에 장착
        const itemsCopy = [...this.items];
        this.items = [];
        
        itemsCopy.forEach(item => {
            // 가장 적합한 유닛 찾기
            const bestUnit = this.findBestUnitForItem(item);
            if (bestUnit) {
                if (!bestUnit.items) bestUnit.items = [];
                if (bestUnit.items.length < 3) {
                    bestUnit.items.push(item);
                    
                    // 아이템 스탯 적용
                    if (item.stats) {
                        Object.keys(item.stats).forEach(stat => {
                            if (bestUnit.stats[stat] !== undefined) {
                                if (stat.includes('Multiplier') || stat.includes('Bonus')) {
                                    // 배수는 곱셈
                                    bestUnit.stats[stat] = (bestUnit.stats[stat] || 1) * (1 + item.stats[stat]);
                                } else {
                                    // 기본 스탯은 덧셈
                                    bestUnit.stats[stat] += item.stats[stat];
                                }
                            }
                        });
                    }
                } else {
                    // 장착 실패 - 아이템 보관
                    this.items.push(item);
                }
            } else {
                // 적합한 유닛 없음 - 아이템 보관
                this.items.push(item);
            }
        });
    }

    // 아이템에 가장 적합한 유닛 찾기
    findBestUnitForItem(item) {
        if (this.units.length === 0) return null;
        
        let bestUnit = null;
        let bestScore = -1;
        
        this.units.forEach(unit => {
            if (unit.items && unit.items.length >= 3) return;
            
            let score = 0;
            
            // 공격 아이템
            if (item.stats && item.stats.attackDamage) {
                score += unit.stats.attackDamage / 10;
            }
            
            // 방어 아이템
            if (item.stats && (item.stats.armor || item.stats.hp)) {
                score += unit.stats.hp / 100;
            }
            
            // 스킬 아이템
            if (item.stats && item.stats.skillDamageBonus) {
                score += unit.skill ? 50 : 0;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestUnit = unit;
            }
        });
        
        return bestUnit;
    }

    // 리롤 결정
    shouldReroll(round) {
        // 골드가 충분하지 않으면 리롤 안함
        if (this.gold < 2) return false;
        
        // 전략 챔피언이 부족하면 리롤
        const strategyUnits = [...this.units, ...this.bench].filter(u => 
            u.traits.includes(this.strategy)
        );
        
        if (strategyUnits.length < 4 && this.gold >= 20) {
            return true;
        }
        
        // 난이도별 리롤 전략
        switch (this.difficulty) {
            case 'easy':
                // 거의 리롤 안함
                return false;
                
            case 'normal':
                // 특정 상황에서만
                if (round >= 10 && this.units.length < this.level && this.gold >= 30) {
                    return Math.random() < 0.3;
                }
                break;
                
            case 'hard':
                // 공격적 리롤
                if (round >= 8 && this.gold >= 30) {
                    return Math.random() < 0.5;
                }
                break;
        }
        
        return false;
    }

    // 레벨업 비용
    getLevelUpCost() {
        return 4;
    }

    // 아이템 추가
    addItem(item) {
        this.items.push(item);
    }

    // 골드 추가
    addGold(amount) {
        this.gold += amount;
    }

    // 피해 받기
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }

    // 패배 확인
    isDefeated() {
        return this.health <= 0;
    }
}

// AI 플레이어 생성
function createAIPlayer(difficulty) {
    return new AIPlayer(difficulty);
}

// 여러 AI 플레이어 생성 (멀티 플레이어 시뮬레이션)
function createAIPlayers(count, difficulty) {
    const players = [];
    for (let i = 0; i < count; i++) {
        players.push(new AIPlayer(difficulty));
    }
    return players;
}
