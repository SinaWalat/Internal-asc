'use client';

import React, { useState, useRef, useEffect } from 'react';
import Konva from 'konva';

// Types
export interface CardField {
    id: string;
    type: 'text' | 'image';
    value: string; // Text content or Image URL
    position: { x: number; y: number };
    size: { width: number; height: number };
    style?: {
        fontSize?: number;
        fontFamily?: string;
        color?: string;
        textAlign?: 'left' | 'center' | 'right';
        fontWeight?: string;
        fontStyle?: string;
    };
    rotation?: number;
    mapping: string;
    side: 'front' | 'back';
}

interface CardDesignCanvasProps {
    width: number;
    height: number;
    elements: CardField[];
    onChange: (elements: CardField[]) => void;
    selectedElementId: string | null;
    setSelectedElementId: (id: string | null) => void;
    backgroundImage: string | null;
}

// Constants
const CANVAS_WIDTH = 870; // 87mm * 10
const CANVAS_HEIGHT = 560; // 56mm * 10
const SNAP_THRESHOLD = 5;

const CardDesignCanvas: React.FC<CardDesignCanvasProps> = ({
    width,
    height,
    elements,
    onChange,
    selectedElementId,
    setSelectedElementId,
    backgroundImage
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage | null>(null);
    const layerRef = useRef<Konva.Layer | null>(null);
    const trRef = useRef<Konva.Transformer | null>(null);
    const bgImageNodeRef = useRef<Konva.Image | null>(null);

    // Scale calculation to fit the container
    const scale = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT);

    // Initialize Stage and Layer
    useEffect(() => {
        if (!containerRef.current) return;

        const stage = new Konva.Stage({
            container: containerRef.current,
            width: width,
            height: height,
            scale: { x: scale, y: scale },
        });

        const layer = new Konva.Layer();
        stage.add(layer);

        // 1. White Background Base (Card Paper)
        const bgBaseNode = new Konva.Rect({
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            fill: 'white',
            listening: false,
            shadowColor: 'black',
            shadowBlur: 10,
            shadowOpacity: 0.1,
        });
        layer.add(bgBaseNode);

        // 2. Background Image Node
        const bgImageNode = new Konva.Image({
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            listening: false, // Don't capture events
            image: undefined,
        });
        layer.add(bgImageNode);
        bgImageNodeRef.current = bgImageNode;

        // Transformer
        const tr = new Konva.Transformer({
            boundBoxFunc: (oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                }
                return newBox;
            },
        });
        layer.add(tr);

        stageRef.current = stage;
        layerRef.current = layer;
        trRef.current = tr;

        // Deselect on click empty area
        stage.on('mousedown touchstart', (e) => {
            if (e.target === stage) {
                setSelectedElementId(null);
            }
        });

        // Initial Draw
        layer.batchDraw();

        return () => {
            stage.destroy();
        };
    }, []); // Run once on mount

    // Update Stage Dimensions
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        stage.width(width);
        stage.height(height);
        stage.scale({ x: scale, y: scale });
        stage.batchDraw();
    }, [width, height, scale]);

    // Update Background Image
    useEffect(() => {
        const bgNode = bgImageNodeRef.current;
        const layer = layerRef.current;

        if (!bgNode || !layer) return;

        if (backgroundImage) {
            const img = new Image();
            // Only set crossOrigin if not a blob URL to avoid issues
            if (!backgroundImage.startsWith('blob:')) {
                img.crossOrigin = 'Anonymous';
            }

            img.onload = () => {
                bgNode.image(img);
                layer.batchDraw();
                // Double check draw
                setTimeout(() => layer.batchDraw(), 10);
            };

            img.src = backgroundImage;

            // Handle cached images immediately
            if (img.complete) {
                bgNode.image(img);
                layer.batchDraw();
            }
        } else {
            bgNode.image(undefined);
            layer.batchDraw();
        }
    }, [backgroundImage]);

    // Smart Guides Logic (Helper functions)
    const getLineGuideStops = (skipShape: Konva.Node) => {
        const stage = stageRef.current;
        if (!stage) return { vertical: [], horizontal: [] };

        const vertical = [0, stage.width() / 2, stage.width()];
        const horizontal = [0, stage.height() / 2, stage.height()];

        stage.find('.object').forEach((guideItem) => {
            if (guideItem === skipShape) return;
            const box = guideItem.getClientRect();
            vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
            horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
        });
        return { vertical, horizontal };
    };

    const getObjectSnappingEdges = (node: Konva.Node) => {
        const box = node.getClientRect();
        const absPos = node.absolutePosition();

        return {
            vertical: [
                { guide: Math.round(box.x), offset: Math.round(absPos.x - box.x), snap: 'start' },
                { guide: Math.round(box.x + box.width / 2), offset: Math.round(absPos.x - box.x - box.width / 2), snap: 'center' },
                { guide: Math.round(box.x + box.width), offset: Math.round(absPos.x - box.x - box.width), snap: 'end' },
            ],
            horizontal: [
                { guide: Math.round(box.y), offset: Math.round(absPos.y - box.y), snap: 'start' },
                { guide: Math.round(box.y + box.height / 2), offset: Math.round(absPos.y - box.y - box.height / 2), snap: 'center' },
                { guide: Math.round(box.y + box.height), offset: Math.round(absPos.y - box.y - box.height), snap: 'end' },
            ],
        };
    };

    const getGuides = (lineGuideStops: any, itemBounds: any) => {
        const resultV: any[] = [];
        const resultH: any[] = [];

        lineGuideStops.vertical.forEach((lineGuide: number) => {
            itemBounds.vertical.forEach((itemBound: any) => {
                const diff = Math.abs(lineGuide - itemBound.guide);
                if (diff < SNAP_THRESHOLD) {
                    resultV.push({ lineGuide: lineGuide, diff: diff, snap: itemBound.snap, offset: itemBound.offset });
                }
            });
        });

        lineGuideStops.horizontal.forEach((lineGuide: number) => {
            itemBounds.horizontal.forEach((itemBound: any) => {
                const diff = Math.abs(lineGuide - itemBound.guide);
                if (diff < SNAP_THRESHOLD) {
                    resultH.push({ lineGuide: lineGuide, diff: diff, snap: itemBound.snap, offset: itemBound.offset });
                }
            });
        });

        const guides: any[] = [];
        const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
        const minH = resultH.sort((a, b) => a.diff - b.diff)[0];

        if (minV) {
            guides.push({ lineGuide: minV.lineGuide, offset: minV.offset, orientation: 'V', snap: minV.snap });
        }
        if (minH) {
            guides.push({ lineGuide: minH.lineGuide, offset: minH.offset, orientation: 'H', snap: minH.snap });
        }
        return guides;
    };

    const drawGuides = (guides: any[], layer: Konva.Layer) => {
        guides.forEach(g => {
            let points = [];
            if (g.orientation === 'H') {
                points = [-6000, g.lineGuide, 6000, g.lineGuide];
            } else {
                points = [g.lineGuide, -6000, g.lineGuide, 6000];
            }
            const line = new Konva.Line({
                points: points,
                stroke: 'rgb(0, 161, 255)',
                strokeWidth: 1,
                dash: [4, 6],
                name: 'guide-line',
                listening: false
            });
            layer.add(line);
        });
    };

    // Sync Elements
    useEffect(() => {
        const layer = layerRef.current;
        const tr = trRef.current;
        if (!layer || !tr) return;

        // Clear existing elements (except bg and transformer)
        const nodesToRemove = layer.find('.object');
        nodesToRemove.forEach(node => node.destroy());

        // Clear guides
        layer.find('.guide-line').forEach(node => node.destroy());

        // Re-add elements
        elements.forEach(el => {
            let node: Konva.Shape | Konva.Group;

            const commonProps = {
                id: el.id,
                x: el.position.x,
                y: el.position.y,
                width: el.size.width,
                height: el.size.height,
                rotation: el.rotation || 0,
                draggable: true,
                name: 'object',
            };

            if (el.type === 'text') {
                node = new Konva.Text({
                    ...commonProps,
                    text: el.value,
                    fontSize: el.style?.fontSize || 16,
                    fontFamily: el.style?.fontFamily || 'Arial',
                    fill: el.style?.color || 'black',
                    align: el.style?.textAlign || 'left',
                    // Text specific: don't set fixed height, let it wrap
                    height: undefined,
                });
                // Set width for wrapping
                node.width(el.size.width);
            } else {
                // Image with cropping (Rect + FillPattern)
                node = new Konva.Rect({
                    ...commonProps,
                });

                // Load image
                const img = new Image();
                img.src = el.value;
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const scale = Math.max(
                        node.width() / img.width,
                        node.height() / img.height
                    );
                    // Cast to Rect to access fillPattern properties
                    (node as Konva.Rect).fillPatternImage(img);
                    (node as Konva.Rect).fillPatternScaleX(scale);
                    (node as Konva.Rect).fillPatternScaleY(scale);
                    layer.batchDraw();
                };
            }

            // Events
            node.on('mousedown tap', () => {
                setSelectedElementId(el.id);
            });

            node.on('dragstart', () => {
                setSelectedElementId(el.id);
            });

            node.on('dragmove', (e) => {
                // Smart Guides
                layer.find('.guide-line').forEach(l => l.destroy());

                const lineGuideStops = getLineGuideStops(e.target);
                const itemBounds = getObjectSnappingEdges(e.target);
                const guides = getGuides(lineGuideStops, itemBounds);

                if (guides.length) {
                    drawGuides(guides, layer);
                    const absPos = e.target.absolutePosition();
                    guides.forEach((lg) => {
                        if (lg.orientation === 'V') {
                            absPos.x = lg.lineGuide + lg.offset;
                        } else if (lg.orientation === 'H') {
                            absPos.y = lg.lineGuide + lg.offset;
                        }
                    });
                    e.target.absolutePosition(absPos);
                }
            });

            node.on('dragend', (e) => {
                layer.find('.guide-line').forEach(l => l.destroy());
                const target = e.target;

                // Update parent state
                const newElements = elements.map(item => {
                    if (item.id === el.id) {
                        return {
                            ...item,
                            position: { x: target.x(), y: target.y() }
                        };
                    }
                    return item;
                });
                onChange(newElements);
            });

            node.on('transformend', (e) => {
                const target = e.target;
                const scaleX = target.scaleX();
                const scaleY = target.scaleY();

                // Reset scale
                target.scaleX(1);
                target.scaleY(1);

                const newElements = elements.map(item => {
                    if (item.id === el.id) {
                        if (item.type === 'text') {
                            // FIX: Text Resizing
                            // When resizing text, we want to change the FONT SIZE.
                            // Konva Text width is just for wrapping.
                            // We need to calculate new font size based on scaleY (vertical resize)

                            const oldFontSize = item.style?.fontSize || 16;
                            const newFontSize = Math.round(oldFontSize * scaleY);

                            // Also update width for wrapping
                            const newWidth = target.width() * scaleX;

                            return {
                                ...item,
                                position: { x: target.x(), y: target.y() },
                                size: {
                                    width: newWidth,
                                    height: target.height() * scaleY
                                },
                                style: {
                                    ...item.style,
                                    fontSize: newFontSize
                                },
                                rotation: target.rotation()
                            };
                        } else {
                            // Image Resizing
                            return {
                                ...item,
                                position: { x: target.x(), y: target.y() },
                                size: {
                                    width: target.width() * scaleX,
                                    height: target.height() * scaleY
                                },
                                rotation: target.rotation()
                            };
                        }
                    }
                    return item;
                });
                onChange(newElements);
            });

            layer.add(node);
        });

        // Update Transformer Selection & Config
        if (selectedElementId) {
            const selectedNode = layer.findOne('#' + selectedElementId);
            if (selectedNode) {
                tr.nodes([selectedNode]);

                // Configure Transformer based on type
                const el = elements.find(e => e.id === selectedElementId);
                if (el?.type === 'text') {
                    // Text: Lock aspect ratio to avoid distortion, but allow resizing
                    tr.keepRatio(true);
                    tr.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
                } else {
                    // Image: Allow free resize to change the "frame" (cropping)
                    tr.keepRatio(false);
                    tr.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']);
                }
            } else {
                tr.nodes([]);
            }
        } else {
            tr.nodes([]);
        }

        tr.moveToTop();
        layer.batchDraw();

    }, [elements, selectedElementId]); // Re-run when elements or selection changes

    return (
        <div
            ref={containerRef}
            style={{
                width: width,
                height: height,
                overflow: 'hidden',
                background: '#f0f0f0'
            }}
        />
    );
};

export default CardDesignCanvas;
