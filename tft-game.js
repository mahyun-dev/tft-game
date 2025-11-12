// 11사단 기갑수색대대 롤토체스 메인 게임 로직
// 전체 게임 흐름 관리

// 유닛 복사 헬퍼 함수 (함수 보존)
function cloneUnit(unit) {
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

class TFTGame {
    constructor() {
        this.round = 0;
        this.stage = 1;
        this.phase = 'planning'; // 'planning', 'battle', 'results'
        
        // 타이머
        this.planningTime = 30; // 30초 준비 시간
        this.currentTimer = this.planningTime;
        this.timerInterval = null;
        
        // 플레이어
        this.player = {
            id: 0,
            name: '플레이어',
            isPlayer: true,
            gold: 0,
            level: 1,
            exp: 0,
            health: 100,
            units: [], // 필드 유닛
            bench: [], // 벤치 유닛
            items: [], // 보관함 아이템
            winStreak: 0,
            loseStreak: 0,
            placement: 0, // 순위
            isAlive: true
        };
        
        // 7명의 AI 상대들
        this.aiPlayers = [];
        for (let i = 1; i <= 7; i++) {
            const difficulties = ['easy', 'normal', 'normal', 'normal', 'normal', 'hard', 'hard'];
            const ai = createAIPlayer(difficulties[i - 1]);
            ai.id = i;
            ai.name = `AI ${i}`;
            ai.isPlayer = false;
            ai.isAlive = true;
            ai.placement = 0;
            ai.exp = 0;
            this.aiPlayers.push(ai);
        }
        
        // 현재 대전 상대 (라운드마다 변경)
        this.currentOpponent = null;
        
        // 상점
        this.shop = [];
        
        // 전투 시스템
        this.battleSystem = new BattleSystem();
        
        // 게임 상태
        this.isGameOver = false;
        this.winner = null;
        
        // 콜백
        this.onTimerUpdate = null;
        this.onBattleStart = null;
    }
    
    // 살아있는 플레이어들
    getAlivePlayers() {
        const alive = [this.player, ...this.aiPlayers].filter(p => p.isAlive);
        return alive;
    }
    
    // 랜덤 대전 상대 선택
    selectRandomOpponent() {
        const aliveAIs = this.aiPlayers.filter(ai => ai.isAlive);
        if (aliveAIs.length === 0) {
            this.gameOver('player');
            return null;
        }
        
        // 랜덤 선택
        this.currentOpponent = aliveAIs[Math.floor(Math.random() * aliveAIs.length)];
        return this.currentOpponent;
    }

    // 게임 시작
    start() {
        this.round = 1;
        this.stage = 1;
        this.player.gold = 4;
        
        // 모든 AI에게 초기 골드 지급
        this.aiPlayers.forEach(ai => {
            ai.gold = 4;
            
            // AI에게도 시작 챔피언 1개 지급
            const tier1Champions = CHAMPIONS.filter(c => c.cost === 1);
            const randomChampion = tier1Champions[Math.floor(Math.random() * tier1Champions.length)];
            ai.bench.push(cloneUnit(randomChampion));
        });
        
        // 시작 시 1코스트 랜덤 챔피언 1개 지급
        const tier1Champions = CHAMPIONS.filter(c => c.cost === 1);
        const randomChampion = tier1Champions[Math.floor(Math.random() * tier1Champions.length)];
        this.player.bench.push(cloneUnit(randomChampion));
        
        // 첫 라운드 대전 상대 선택
        this.selectRandomOpponent();
        
        this.refreshShop();
        this.startPlanningPhase();
    }

    // 다음 라운드
    nextRound() {
        this.round++;
        
        // 스테이지 업데이트
        if (this.round % 7 === 1 && this.round > 1) {
            this.stage++;
        }
        
        // 골드 지급
        this.giveGold();
        
        // 플레이어 자동 경험치 2 지급
        this.player.exp += 2;
        
        // 플레이어 레벨업 체크
        let expToLevel = this.getExpToLevel(this.player.level);
        while (this.player.exp >= expToLevel && this.player.level < 9) {
            this.player.exp -= expToLevel;
            this.player.level++;
            expToLevel = this.getExpToLevel(this.player.level);
        }
        
        // 모든 AI도 자동 경험치 지급 및 레벨업
        this.aiPlayers.forEach(ai => {
            if (!ai.exp) ai.exp = 0;
            ai.exp += 2;
            
            let expToLevel = this.getExpToLevel(ai.level);
            while (ai.exp >= expToLevel && ai.level < 9) {
                ai.exp -= expToLevel;
                ai.level++;
                expToLevel = this.getExpToLevel(ai.level);
            }
        });
        
        // 새 대전 상대 선택
        this.selectRandomOpponent();
        
        // 상점 리프레시
        this.refreshShop();
        
        // 모든 살아있는 AI 턴 실행
        this.aiPlayers.forEach(ai => {
            if (ai.isAlive) {
                ai.takeTurn(this.shop, this.round);
            }
        });
        
        // AI vs AI 전투 시뮬레이션 (플레이어가 대전하지 않는 AI들끼리)
        if (!this.isPVERound(this.round)) {
            this.simulateAIBattles();
        }
        
        // 계획 단계 시작
        this.startPlanningPhase();
    }

    // 계획 단계 시작
    startPlanningPhase() {
        this.phase = 'planning';
        
        // 타이머 시작
        this.currentTimer = this.planningTime;
        this.startTimer();
        
        // UI 업데이트 (외부에서 처리)
        if (this.onPlanningPhase) {
            this.onPlanningPhase();
        }
    }
    
    // 타이머 시작
    startTimer() {
        // 기존 타이머 정리
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.currentTimer--;
            
            // UI 업데이트
            if (this.onTimerUpdate) {
                this.onTimerUpdate(this.currentTimer, this.phase);
            }
            
            // 시간 종료
            if (this.currentTimer <= 0) {
                clearInterval(this.timerInterval);
                
                if (this.phase === 'planning') {
                    // 자동으로 전투 시작
                    this.startBattle();
                }
            }
        }, 1000);
    }
    
    // 타이머 정지
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // 전투 시작
    startBattle() {
        // 유닛이 없으면 전투 건너뛰기
        if (this.player.units.length === 0) {
            // 자동 패배 처리
            this.handleBattleResult({ winner: 'enemy', playerUnitsLeft: 0, enemyUnitsLeft: 1 }, this.isPVERound(this.round));
            return;
        }
        
        // 대전 상대가 없으면 (게임 종료)
        if (!this.currentOpponent) {
            return;
        }
        
        // 타이머 정지
        this.stopTimer();
        
        this.phase = 'battle';
        
        // 타이머 UI 업데이트
        if (this.onTimerUpdate) {
            this.onTimerUpdate(0, 'battle');
        }
        
        // UI 전투 시작 알림 (모달 표시)
        if (this.onBattleStart) {
            this.onBattleStart();
        }
        
        // 시너지 적용
        const playerSynergies = applySynergies(this.player.units, this.player.units);
        const aiSynergies = applySynergies(this.currentOpponent.units, this.currentOpponent.units);
        
        // PVE 라운드 체크
        const isPVE = this.isPVERound(this.round);
        let enemyTeam;
        
        if (isPVE) {
            enemyTeam = generateCreeps(this.round);
        } else {
            enemyTeam = this.currentOpponent.units;
        }
        
        // 전투 시작
        this.battleSystem.startBattle(this.player.units, enemyTeam)
            .then(result => {
                this.handleBattleResult(result, isPVE);
            });
    }

    // 전투 결과 처리
    handleBattleResult(result, isPVE) {
        this.phase = 'results';
        
        if (result.winner === 'player') {
            // 승리
            this.player.winStreak++;
            this.player.loseStreak = 0;
            
            // 승리 보너스 골드
            this.player.gold += 1 + Math.floor(this.player.winStreak / 2);
            
            // PVE 승리 - 크립 보상 (아이템 또는 골드)
            if (isPVE) {
                const rewards = getCreepRewards(this.round);
                
                // 골드 보상
                if (rewards.gold > 0) {
                    this.player.gold += rewards.gold;
                }
                
                // 아이템 보상
                if (rewards.items && rewards.items.length > 0) {
                    rewards.items.forEach(item => {
                        this.player.items.push(item);
                    });
                }
            }
            
            // AI가 피해 받음 (PVP만)
            if (!isPVE) {
                const damage = this.battleSystem.calculateDamage(
                    result.playerTeam.filter(u => !u.isDead),
                    this.player.level
                );
                this.currentOpponent.health -= damage;
                
                // 상대 AI 체력 체크
                if (this.currentOpponent.health <= 0) {
                    this.currentOpponent.health = 0;
                    this.currentOpponent.isAlive = false;
                    
                    // 순위 결정
                    const aliveCount = this.getAlivePlayers().length;
                    this.currentOpponent.placement = aliveCount + 1;
                }
            }
            
        } else if (result.winner === 'enemy') {
            // 패배
            this.player.loseStreak++;
            this.player.winStreak = 0;
            
            // 연패 보너스 골드
            this.player.gold += Math.min(Math.floor(this.player.loseStreak / 2), 3);
            
            // 플레이어가 피해 받음
            if (!isPVE) {
                const damage = this.battleSystem.calculateDamage(
                    result.enemyTeam.filter(u => !u.isDead),
                    this.currentOpponent.level
                );
                this.player.health -= damage;
                
                if (this.player.health <= 0) {
                    this.player.health = 0;
                    this.player.isAlive = false;
                    
                    // 순위 결정
                    const aliveCount = this.getAlivePlayers().length;
                    this.player.placement = aliveCount + 1;
                    
                    this.gameOver();
                    return;
                }
            } else {
                // PVE 패배
                this.player.health -= Math.floor(this.round / 2);
                
                if (this.player.health <= 0) {
                    this.player.health = 0;
                    this.player.isAlive = false;
                    this.gameOver();
                    return;
                }
            }
            
        } else {
            // 무승부
            this.player.winStreak = 0;
            this.player.loseStreak = 0;
        }
        
        // 게임 종료 체크 (살아있는 플레이어가 1명 이하)
        const alivePlayers = this.getAlivePlayers();
        if (alivePlayers.length <= 1) {
            if (alivePlayers.length === 1 && alivePlayers[0].isPlayer) {
                this.player.placement = 1;
            }
            this.gameOver();
            return;
        }
        
        // 다음 라운드
        setTimeout(() => {
            this.nextRound();
        }, 3000);
    }

    // PVE 라운드 체크
    isPVERound(round) {
        return [1, 2, 3, 9, 18, 27].includes(round);
    }

    // 골드 지급
    giveGold() {
        // 기본 골드 5
        let gold = 5;
        
        // 이자 (10골드당 1골드, 최대 5골드)
        gold += Math.min(Math.floor(this.player.gold / 10), 5);
        
        // 연승/연패 보너스는 전투 결과에서 처리
        
        this.player.gold += gold;
        
        // 모든 AI에게도 골드 지급
        this.aiPlayers.forEach(ai => {
            if (ai.isAlive) {
                const aiGold = 5 + Math.min(Math.floor(ai.gold / 10), 5);
                ai.gold += aiGold;
            }
        });
    }
    
    // AI vs AI 전투 시뮬레이션
    simulateAIBattles() {
        // 플레이어가 대전하지 않는 AI들을 랜덤 매칭
        const availableAIs = this.aiPlayers.filter(ai => 
            ai.isAlive && ai !== this.currentOpponent
        );
        
        // 짝수 개수로 맞추기 (홀수면 1명은 부전승)
        const matchCount = Math.floor(availableAIs.length / 2);
        
        for (let i = 0; i < matchCount; i++) {
            const ai1 = availableAIs[i * 2];
            const ai2 = availableAIs[i * 2 + 1];
            
            // 간단한 전투 시뮬레이션 (유닛 수와 레벨로 승자 결정)
            const ai1Power = ai1.units.length * ai1.level;
            const ai2Power = ai2.units.length * ai2.level;
            
            const winner = ai1Power > ai2Power ? ai1 : 
                          ai2Power > ai1Power ? ai2 : 
                          Math.random() > 0.5 ? ai1 : ai2;
            const loser = winner === ai1 ? ai2 : ai1;
            
            // 피해 계산 (간단한 버전)
            const damage = 3 + Math.floor(this.round / 3);
            loser.health -= damage;
            
            if (loser.health <= 0) {
                loser.health = 0;
                loser.isAlive = false;
                const aliveCount = this.getAlivePlayers().length;
                loser.placement = aliveCount + 1;
            }
        }
    }

    // 상점 리프레시
    refreshShop() {
        this.shop = [];
        
        // 레벨에 따른 확률
        const odds = this.getChampionOdds(this.player.level);
        
        for (let i = 0; i < 5; i++) {
            const champion = this.rollChampion(odds);
            this.shop.push(cloneUnit(champion));
        }
    }

    // 챔피언 확률 (레벨별)
    getChampionOdds(level) {
        const oddsTable = {
            1: [100, 0, 0, 0, 0],
            2: [100, 0, 0, 0, 0],
            3: [75, 25, 0, 0, 0],
            4: [55, 30, 15, 0, 0],
            5: [45, 33, 20, 2, 0],
            6: [30, 40, 25, 5, 0],
            7: [19, 35, 35, 10, 1],
            8: [16, 20, 35, 25, 4],
            9: [9, 15, 30, 40, 6]
        };
        
        return oddsTable[level] || oddsTable[9];
    }

    // 챔피언 롤
    rollChampion(odds) {
        const random = Math.random() * 100;
        let cumulative = 0;
        let tier = 1;
        
        for (let i = 0; i < odds.length; i++) {
            cumulative += odds[i];
            if (random < cumulative) {
                tier = i + 1;
                break;
            }
        }
        
        // 해당 티어의 챔피언 중 랜덤 선택
        const tierChampions = getChampionsByCost(tier);
        return tierChampions[Math.floor(Math.random() * tierChampions.length)];
    }

    // 챔피언 구매
    buyChampion(shopIndex) {
        if (shopIndex < 0 || shopIndex >= this.shop.length) return false;
        
        const champion = this.shop[shopIndex];
        
        // 골드 확인
        if (this.player.gold < champion.cost) {
            return false;
        }
        
        // 벤치 공간 확인
        if (this.player.bench.length >= 9) {
            return false;
        }
        
        // 구매
        this.player.gold -= champion.cost;
        this.player.bench.push(cloneUnit(champion));
        
        // 상점에서 제거
        this.shop[shopIndex] = null;
        
        // 3스택 업그레이드 체크
        this.checkUpgrades();
        
        return true;
    }

    // 챔피언 판매
    sellChampion(unit, fromBench = true) {
        const source = fromBench ? this.player.bench : this.player.units;
        const index = source.indexOf(unit);
        
        if (index < 0) return false;
        
        // 판매 가격 (별 수에 따라)
        const sellPrice = unit.cost * (unit.stars || 1);
        this.player.gold += sellPrice;
        
        // 제거
        source.splice(index, 1);
        
        // 아이템 반환
        if (unit.items) {
            unit.items.forEach(item => {
                this.player.items.push(item);
            });
        }
        
        return true;
    }

    // 유닛 배치 (벤치 -> 필드)
    placeUnit(unit, position) {
        const benchIndex = this.player.bench.indexOf(unit);
        if (benchIndex < 0) return false;
        
        // 레벨 제한 확인
        if (this.player.units.length >= this.player.level) {
            return false;
        }
        
        // 위치 확인
        if (position.x < 0 || position.x >= 7 || position.y < 0 || position.y >= 4) {
            return false;
        }
        
        // 이미 유닛이 있는지 확인
        const existingUnit = this.player.units.find(u => 
            u.position.x === position.x && u.position.y === position.y
        );
        
        if (existingUnit) {
            // 위치 교환
            existingUnit.position = null;
            this.player.bench.push(existingUnit);
            this.player.units.splice(this.player.units.indexOf(existingUnit), 1);
        }
        
        // 배치
        unit.position = position;
        this.player.units.push(unit);
        this.player.bench.splice(benchIndex, 1);
        
        return true;
    }

    // 유닛 제거 (필드 -> 벤치)
    removeUnit(unit) {
        const index = this.player.units.indexOf(unit);
        if (index < 0) return false;
        
        // 벤치 공간 확인
        if (this.player.bench.length >= 9) {
            return false;
        }
        
        // 제거
        unit.position = null;
        this.player.bench.push(unit);
        this.player.units.splice(index, 1);
        
        return true;
    }

    // 레벨업
    levelUp() {
        if (this.player.level >= 9) return false;
        
        const cost = 4;
        if (this.player.gold < cost) return false;
        
        this.player.gold -= cost;
        this.player.level++;
        
        return true;
    }

    // 상점 리롤
    rerollShop() {
        if (this.player.gold < 2) return false;
        
        this.player.gold -= 2;
        this.refreshShop();
        
        return true;
    }

    // 경험치 구매
    buyExp() {
        if (this.player.gold < 4) return false;
        
        this.player.gold -= 4;
        this.player.exp += 4;
        
        // 레벨업 체크
        const expToLevel = this.getExpToLevel(this.player.level);
        if (this.player.exp >= expToLevel) {
            this.player.exp -= expToLevel;
            this.player.level++;
        }
        
        return true;
    }

    // 레벨업 필요 경험치
    getExpToLevel(level) {
        const expTable = {
            1: 2, 2: 2, 3: 6, 4: 10,
            5: 20, 6: 36, 7: 56, 8: 80
        };
        return expTable[level] || 999;
    }

    // 3스택 업그레이드
    checkUpgrades() {
        let hasUpgrade = true;
        
        // 업그레이드가 더 이상 없을 때까지 반복
        while (hasUpgrade) {
            hasUpgrade = false;
            const allUnits = [...this.player.bench, ...this.player.units];
            const championGroups = {};
            
            allUnits.forEach(unit => {
                // 챔피언 이름과 별 수로 그룹화
                const key = `${unit.name}_${unit.stars || 1}`;
                if (!championGroups[key]) {
                    championGroups[key] = [];
                }
                championGroups[key].push(unit);
            });
            
            // 각 그룹 체크
            for (const key of Object.keys(championGroups)) {
                const group = championGroups[key];
                if (group.length >= 3) {
                    hasUpgrade = true;
                    
                    // 첫 번째 유닛 업그레이드
                    const upgraded = group[0];
                    const oldStars = upgraded.stars || 1;
                    
                    // 3성은 더 이상 업그레이드 불가
                    if (oldStars >= 3) {
                        continue;
                    }
                    
                    upgraded.stars = oldStars + 1;
                    
                    // 스탯 1.8배 증가
                    upgraded.stats.hp = Math.floor(upgraded.stats.hp * 1.8);
                    upgraded.currentHp = upgraded.stats.hp;
                    upgraded.stats.attackDamage = Math.floor(upgraded.stats.attackDamage * 1.8);
                    upgraded.stats.armor = Math.floor(upgraded.stats.armor * 1.8);
                    upgraded.stats.magicResist = Math.floor(upgraded.stats.magicResist * 1.8);
                    
                    // 나머지 2개 제거
                    for (let i = 1; i <= 2; i++) {
                        const toRemove = group[i];
                        
                        let benchIndex = this.player.bench.indexOf(toRemove);
                        if (benchIndex >= 0) {
                            this.player.bench.splice(benchIndex, 1);
                        } else {
                            let unitIndex = this.player.units.indexOf(toRemove);
                            if (unitIndex >= 0) {
                                this.player.units.splice(unitIndex, 1);
                            }
                        }
                    }
                    
                    // 업그레이드 로그
                    if (this.onUpgrade) {
                        this.onUpgrade(upgraded.name, upgraded.stars);
                    }
                    
                    // 하나 업그레이드 후 다시 처음부터 체크
                    break;
                }
            }
        }
    }

    // 아이템 조합
    combineItems(item1, item2) {
        const combined = combineItems(item1, item2);
        if (!combined) return null;
        
        // 재료 제거
        const index1 = this.player.items.indexOf(item1);
        const index2 = this.player.items.indexOf(item2);
        
        if (index1 >= 0) this.player.items.splice(index1, 1);
        if (index2 >= 0) this.player.items.splice(index2, 1);
        
        return combined;
    }

    // 아이템 장착
    equipItem(unit, item) {
        return applyItemToUnit(unit, item);
    }

    // 게임 오버
    gameOver() {
        this.isGameOver = true;
        this.stopTimer();
        
        // 순위 결정 (플레이어가 살아있으면 1등, 아니면 꼴등)
        if (this.player.isAlive) {
            this.player.placement = 1;
            this.winner = 'player';
        } else {
            this.winner = 'eliminated';
        }
        
        if (this.onGameOver) {
            this.onGameOver(this.winner, this.player.placement);
        }
    }

    // 게임 상태 가져오기
    getGameState() {
        return {
            round: this.round,
            stage: this.stage,
            phase: this.phase,
            player: {
                ...this.player,
                synergies: calculateSynergies(this.player.units)
            },
            currentOpponent: this.currentOpponent ? {
                id: this.currentOpponent.id,
                name: this.currentOpponent.name,
                health: this.currentOpponent.health,
                level: this.currentOpponent.level,
                units: this.currentOpponent.units.length
            } : null,
            allPlayers: [this.player, ...this.aiPlayers].map(p => ({
                id: p.id,
                name: p.name,
                isPlayer: p.isPlayer,
                health: p.health,
                level: p.level,
                isAlive: p.isAlive,
                placement: p.placement
            })),
            shop: this.shop,
            isGameOver: this.isGameOver,
            winner: this.winner
        };
    }
}

// 크립 보상 시스템
function getCreepRewards(round) {
    const rewards = {
        gold: 0,
        items: []
    };
    
    // BASE_ITEMS를 배열로 변환
    const baseItemsArray = Object.values(BASE_ITEMS);
    const combinedItemsArray = Object.values(COMBINED_ITEMS);
    
    // 라운드별 보상 설정
    if (round === 1) {
        // 1라운드: 골드 2개
        rewards.gold = 2;
    } else if (round === 2) {
        // 2라운드: 골드 3개
        rewards.gold = 3;
    } else if (round === 3) {
        // 3라운드: 골드2, 랜덤 기본 아이템 1개
        rewards.gold = 2;
        if (baseItemsArray.length > 0) {
            rewards.items.push(baseItemsArray[Math.floor(Math.random() * baseItemsArray.length)]);
        }
    } else if (round % 10 === 0) {
        // 10, 20, 30 라운드: 조합 아이템 + 골드
        if (combinedItemsArray.length > 0) {
            rewards.items.push(combinedItemsArray[Math.floor(Math.random() * combinedItemsArray.length)]);
        }
        rewards.gold = 3 + Math.floor(round / 10);
    } else if (round % 5 === 0) {
        // 5, 15, 25 라운드: 기본 아이템 2개
        for (let i = 0; i < 2; i++) {
            rewards.items.push(baseItemsArray[Math.floor(Math.random() * baseItemsArray.length)]);
        }
        rewards.gold = 2;
    } else {
        // 일반 크립 라운드: 골드 또는 기본 아이템
        if (Math.random() > 0.5) {
            rewards.gold = 1 + Math.floor(round / 5);
        } else {
            rewards.items.push(baseItemsArray[Math.floor(Math.random() * baseItemsArray.length)]);
        }
    }
    
    return rewards;
}

// 게임 인스턴스 생성
let game = null;

function startNewGame(difficulty = 'normal') {
    game = new TFTGame();
    game.start();
    return game;
}
