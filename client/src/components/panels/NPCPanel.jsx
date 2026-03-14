import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useGame } from '../../contexts/GameContext.jsx';
import { Stars } from '../shared';
import { generatePortraitAsync } from '../../services/imageService.js';

function RelationshipWeb() {
  const svgRef = useRef(null);
  const { state, dispatch } = useGame();
  const selectedNpc = state.selected.npc;

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const width = 600, height = 400;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Click SVG background to deselect
    svg.on('click', () => { dispatch({ type: 'SELECT_ITEM', category: 'npc', payload: null }); });

    // Glow filter for selected node
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'node-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const rels = state.gameData.npcRelationships;
    const npcList = state.gameData.npcs;
    const allNames = new Set();
    rels.forEach(r => { allNames.add(r.source); allNames.add(r.target); });
    const nodes = Array.from(allNames).map(name => {
      const npc = npcList.find(n => n.name === name);
      return { id: name, avatar: npc ? npc.avatar : '⚔️', relationship: npc ? npc.relationship : 'neutral', isPlayer: name === state.gameData.character.name };
    });
    const links = rels.map(r => ({ source: r.source, target: r.target, type: r.type }));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width/2, height/2))
      .force('collision', d3.forceCollide().radius(30));

    const linkColors = { ally: '#4caf50', hostile: '#c62828', neutral: '#4fc3f7', unknown: '#3a3a55' };
    const link = svg.append('g').selectAll('line').data(links).enter().append('line')
      .attr('stroke', d => linkColors[d.type] || linkColors.neutral)
      .attr('stroke-width', d => {
        if (!selectedNpc) return 1.5;
        const src = typeof d.source === 'string' ? d.source : d.source.id;
        const tgt = typeof d.target === 'string' ? d.target : d.target.id;
        return (src === selectedNpc || tgt === selectedNpc) ? 3 : 1;
      })
      .attr('stroke-opacity', d => {
        if (!selectedNpc) return 0.5;
        const src = typeof d.source === 'string' ? d.source : d.source.id;
        const tgt = typeof d.target === 'string' ? d.target : d.target.id;
        return (src === selectedNpc || tgt === selectedNpc) ? 1 : 0.12;
      });

    const nodeG = svg.append('g').selectAll('g').data(nodes).enter().append('g')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        dispatch({ type: 'SELECT_ITEM', category: 'npc', payload: d.id === selectedNpc ? null : d.id });
      })
      .call(d3.drag()
        .on('start', (e,d) => { if(!e.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
        .on('drag', (e,d) => { d.fx=e.x; d.fy=e.y; })
        .on('end', (e,d) => { if(!e.active) sim.alphaTarget(0); d.fx=null; d.fy=null; })
      );

    const nodeColors = { ally: '#2e7d32', neutral: '#1a6b8a', hostile: '#8b1a1a', rumored: '#3a3a55' };
    nodeG.append('circle')
      .attr('r', d => d.isPlayer ? 22 : (d.id === selectedNpc ? 20 : 16))
      .attr('fill', d => d.id === selectedNpc ? '#2a1f10' : '#1a1a2e')
      .attr('stroke', d => {
        if (d.id === selectedNpc) return '#f5d478';
        return d.isPlayer ? '#c9a84c' : nodeColors[d.relationship] || '#3a3a55';
      })
      .attr('stroke-width', d => {
        if (d.id === selectedNpc) return 4;
        return d.isPlayer ? 3 : 2;
      })
      .attr('filter', d => d.id === selectedNpc ? 'url(#node-glow)' : null);

    nodeG.append('text').text(d => d.avatar).attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('font-size', d => d.isPlayer ? '14px' : (d.id === selectedNpc ? '13px' : '11px'))
      .style('pointer-events', 'none');
    nodeG.append('text').text(d => d.id.split(' ')[0]).attr('text-anchor', 'middle')
      .attr('dy', d => d.isPlayer ? 36 : (d.id === selectedNpc ? 34 : 28))
      .attr('fill', d => d.id === selectedNpc ? '#f5d478' : '#9d9dba')
      .attr('font-size', d => d.id === selectedNpc ? '10px' : '9px')
      .attr('font-weight', d => d.id === selectedNpc ? '600' : '400')
      .style('pointer-events', 'none');

    if (selectedNpc) {
      const connectedNames = new Set([selectedNpc]);
      rels.forEach(r => {
        if (r.source === selectedNpc) connectedNames.add(r.target);
        if (r.target === selectedNpc) connectedNames.add(r.source);
      });
      nodeG.style('opacity', d => connectedNames.has(d.id) ? 1 : 0.3);
    }

    sim.on('tick', () => {
      link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }, [state.gameData.npcRelationships, state.gameData.npcs, selectedNpc]);

  return <div className="relationship-web"><svg ref={svgRef} style={{width:'100%',height:400}} /></div>;
}

/** NPC Avatar — shows generated portrait or emoji fallback */
function NPCAvatar({ npc, size = 44 }) {
  const { state, dispatch } = useGame();

  const handleGenerate = (e) => {
    e.stopPropagation();
    if (!state.xaiKey) return;
    generatePortraitAsync({
      apiKey: state.xaiKey,
      name: npc.name,
      description: npc.desc || '',
      role: npc.role || '',
      relationship: npc.relationship || 'neutral',
    }, dispatch, 'npc');
  };

  if (npc.image) {
    return (
      <div className={`npc-avatar ${npc.relationship}`} style={{
        width: size, height: size, borderRadius: 6,
        overflow: 'hidden', padding: 0,
        border: '2px solid',
        borderColor: npc.relationship === 'ally' ? 'var(--emerald)' :
                     npc.relationship === 'hostile' ? 'var(--crimson)' :
                     npc.relationship === 'rumored' ? 'var(--muted)' : 'var(--gold-dim)',
      }}>
        <img src={npc.image} alt={npc.name} style={{
          width: '100%', height: '100%', objectFit: 'cover',
        }} />
      </div>
    );
  }

  return (
    <div
      className={`npc-avatar ${npc.relationship}`}
      onClick={state.xaiKey ? handleGenerate : undefined}
      title={state.xaiKey ? 'Click to generate portrait' : ''}
      style={{ cursor: state.xaiKey ? 'pointer' : 'default' }}
    >
      {npc.avatar}
    </div>
  );
}

function NPCPanel() {
  const { state, dispatch } = useGame();
  const sel = state.selected.npc;
  const [showWeb, setShowWeb] = useState(false);
  const npcs = state.gameData.npcs;

  const groups = [
    { label: 'Allies', type: 'ally', icon: '💚' },
    { label: 'Neutral', type: 'neutral', icon: '💙' },
    { label: 'Hostile', type: 'hostile', icon: '❤️‍🔥' },
    { label: 'Rumored', type: 'rumored', icon: '❓' },
  ];

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title"><span className="icon">👥</span> NPC Roster</h1>
        <button className="demo-btn" onClick={() => setShowWeb(!showWeb)}>
          {showWeb ? '📋 List View' : '🕸 Relationship Web'}
        </button>
      </div>

      {showWeb ? <RelationshipWeb /> : (
        <div>
          {groups.map(g => {
            const matchTypes = g.type === 'ally' ? ['ally', 'friendly'] : [g.type];
            const filtered = npcs.filter(n => matchTypes.includes(n.relationship));
            if (filtered.length === 0) return null;
            return (
              <div key={g.type} style={{marginBottom:20}}>
                <h3 style={{fontSize:'0.85rem',color:'var(--silver)',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                  {g.icon} {g.label} <span style={{color:'var(--muted)',fontSize:'0.7rem'}}>({filtered.length})</span>
                </h3>
                {filtered.map(npc => (
                  <div key={npc.name} className={`npc-card ${sel===npc.name?'selected':''}`}
                    onClick={() => dispatch({ type: 'SELECT_ITEM', category: 'npc', payload: npc.name })}>
                    <NPCAvatar npc={npc} />
                    <div className="npc-info">
                      <div className="npc-name">{npc.name}</div>
                      <div className="npc-role">{npc.role}</div>
                      <div style={{marginTop:4}}><Stars count={npc.stars} /></div>
                      <div className="npc-status" style={{color:'var(--silver)',marginTop:4}}>{npc.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NPCPanel;
