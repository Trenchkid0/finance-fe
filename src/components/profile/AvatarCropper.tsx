import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Move } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AvatarCropperProps {
	imageSrc: string;
	onCropComplete: (croppedBlob: Blob, previewUrl: string) => void;
	onCancel: () => void;
}

export function AvatarCropper({ imageSrc, onCropComplete, onCancel }: AvatarCropperProps) {
	const [zoom, setZoom] = useState<number>(1);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const dragStart = useRef({ x: 0, y: 0 });
	const containerRef = useRef<HTMLDivElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);

	const [dimensions, setDimensions] = useState({
		renderWidth: 0,
		renderHeight: 0,
		naturalWidth: 0,
		naturalHeight: 0,
	});

	// Reset position and zoom when image changes
	useEffect(() => {
		setZoom(1);
		setPosition({ x: 0, y: 0 });
	}, [imageSrc]);

	// Calculate fitted dimensions when image loads
	const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget;
		const container = containerRef.current;
		if (!container) return;

		const cWidth = container.clientWidth;
		const cHeight = container.clientHeight;

		const nWidth = img.naturalWidth;
		const nHeight = img.naturalHeight;

		// Calculate fit size: ensure shortest side covers container fully
		let rWidth = 0;
		let rHeight = 0;
		const imgAspect = nWidth / nHeight;
		const containerAspect = cWidth / cHeight;

		if (imgAspect > containerAspect) {
			// Image is wider than container
			rHeight = cHeight;
			rWidth = cHeight * imgAspect;
		} else {
			// Image is taller than container
			rWidth = cWidth;
			rHeight = cWidth / imgAspect;
		}

		setDimensions({
			renderWidth: rWidth,
			renderHeight: rHeight,
			naturalWidth: nWidth,
			naturalHeight: nHeight,
		});
	};

	// Mouse & Touch Drag Handlers
	const handleStart = (clientX: number, clientY: number) => {
		setIsDragging(true);
		dragStart.current = {
			x: clientX - position.x,
			y: clientY - position.y,
		};
	};

	const handleMove = (clientX: number, clientY: number) => {
		if (!isDragging) return;
		
		const newX = clientX - dragStart.current.x;
		const newY = clientY - dragStart.current.y;

		// Calculate boundaries to keep the image covering the crop area
		const container = containerRef.current;
		if (!container) return;

		const cropSize = 200; // Size of the crop circle

		// Half size of render space
		const halfW = (dimensions.renderWidth * zoom) / 2;
		const halfH = (dimensions.renderHeight * zoom) / 2;

		// Restrict position so crop area is always covered
		// Center of image is position.x/y relative to container center
		const maxOffsetX = halfW - cropSize / 2;
		const minOffsetX = -(halfW - cropSize / 2);
		const maxOffsetY = halfH - cropSize / 2;
		const minOffsetY = -(halfH - cropSize / 2);

		// Clamp offsets
		const clampedX = Math.max(minOffsetX, Math.min(maxOffsetX, newX));
		const clampedY = Math.max(minOffsetY, Math.min(maxOffsetY, newY));

		setPosition({ x: clampedX, y: clampedY });
	};

	const handleEnd = () => {
		setIsDragging(false);
	};

	// Listeners for window events during drag
	useEffect(() => {
		const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
		const onMouseUp = () => handleEnd();
		const onTouchMove = (e: TouchEvent) => {
			if (e.touches.length > 0) {
				handleMove(e.touches[0].clientX, e.touches[0].clientY);
			}
		};
		const onTouchEnd = () => handleEnd();

		if (isDragging) {
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
			window.addEventListener("touchmove", onTouchMove, { passive: false });
			window.addEventListener("touchend", onTouchEnd);
		}

		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
			window.removeEventListener("touchmove", onTouchMove);
			window.removeEventListener("touchend", onTouchEnd);
		};
	}, [isDragging, position, zoom, dimensions]);

	// Zoom operations
	const handleZoomChange = (newZoom: number) => {
		const clampedZoom = Math.max(1, Math.min(3, newZoom));
		setZoom(clampedZoom);

		// Re-clamp position after zoom change
		setPosition((prev) => {
			const cropSize = 200;
			const halfW = (dimensions.renderWidth * clampedZoom) / 2;
			const halfH = (dimensions.renderHeight * clampedZoom) / 2;
			const maxOffsetX = halfW - cropSize / 2;
			const minOffsetX = -(halfW - cropSize / 2);
			const maxOffsetY = halfH - cropSize / 2;
			const minOffsetY = -(halfH - cropSize / 2);

			return {
				x: Math.max(minOffsetX, Math.min(maxOffsetX, prev.x)),
				y: Math.max(minOffsetY, Math.min(maxOffsetY, prev.y)),
			};
		});
	};

	const handleCrop = () => {
		const img = imageRef.current;
		if (!img || dimensions.renderWidth === 0) return;

		const canvas = document.createElement("canvas");
		canvas.width = 400; // Output high-res width
		canvas.height = 400; // Output high-res height
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const cropSize = 200;
		const canvasSize = 400;
		const scaleRatio = canvasSize / cropSize; // 2.0

		// Fill canvas background with white or transparency
		ctx.fillStyle = "#0D1117";
		ctx.fillRect(0, 0, canvasSize, canvasSize);

		// Move origin to canvas center
		ctx.translate(canvasSize / 2, canvasSize / 2);

		// Apply user offsets and zoom scaled by canvas ratio
		ctx.translate(position.x * scaleRatio, position.y * scaleRatio);
		ctx.scale(zoom * scaleRatio, zoom * scaleRatio);

		// Draw image centered relative to the translated origin
		ctx.drawImage(
			img,
			-dimensions.renderWidth / 2,
			-dimensions.renderHeight / 2,
			dimensions.renderWidth,
			dimensions.renderHeight
		);

		// Export as WebP
		canvas.toBlob((blob) => {
			if (blob) {
				const previewUrl = URL.createObjectURL(blob);
				onCropComplete(blob, previewUrl);
			}
		}, "image/webp", 0.9);
	};

	return (
		<div className="space-y-5">
			{/* Crop Area container */}
			<div
				ref={containerRef}
				className="w-full aspect-square max-w-[300px] mx-auto bg-[#0d1117]/80 relative overflow-hidden border border-[#30363D] cursor-move select-none"
				onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
				onTouchStart={(e) => {
					if (e.touches.length > 0) {
						handleStart(e.touches[0].clientX, e.touches[0].clientY);
					}
				}}
			>
				{/* The Image */}
				<img
					ref={imageRef}
					src={imageSrc}
					alt="Crop source"
					onLoad={handleImageLoad}
					className="absolute pointer-events-none select-none origin-center"
					style={{
						width: `${dimensions.renderWidth}px`,
						height: `${dimensions.renderHeight}px`,
						left: "50%",
						top: "50%",
						marginLeft: `-${dimensions.renderWidth / 2}px`,
						marginTop: `-${dimensions.renderHeight / 2}px`,
						transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
					}}
				/>

				{/* Circular Dimmed Overlay */}
				<div className="absolute inset-0 pointer-events-none flex items-center justify-center">
					{/* Custom box-shadow creates dimmed outer region around a 200px clear circle */}
					<div className="w-[200px] h-[200px] rounded-full border-2 border-accent shadow-[0_0_0_9999px_rgba(13,17,23,0.7)] flex items-center justify-center">
						<Move className="w-5 h-5 text-accent/50 animate-pulse" />
					</div>
				</div>
			</div>

			{/* Zoom Controls */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-xs text-text-muted">
					<span className="font-mono uppercase tracking-wider">Zoom & Adjust</span>
					<span className="font-mono text-text-primary">{Math.round(zoom * 100)}%</span>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => handleZoomChange(zoom - 0.1)}
						className="p-1.5 rounded-lg border border-border bg-elevated hover:bg-[#2D333B] text-text-muted hover:text-text-primary transition"
						aria-label="Zoom out"
					>
						<ZoomOut size={16} />
					</button>

					<input
						type="range"
						min="1"
						max="3"
						step="0.01"
						value={zoom}
						onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
						className="flex-1 h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
					/>

					<button
						type="button"
						onClick={() => handleZoomChange(zoom + 0.1)}
						className="p-1.5 rounded-lg border border-border bg-elevated hover:bg-[#2D333B] text-text-muted hover:text-text-primary transition"
						aria-label="Zoom in"
					>
						<ZoomIn size={16} />
					</button>
				</div>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-2.5 pt-2">
				<Button
					type="button"
					variant="ghost"
					onClick={onCancel}
					className="flex-1 h-10 border border-border hover:bg-elevated text-xs font-semibold"
				>
					Batal
				</Button>
				<Button
					type="button"
					onClick={handleCrop}
					className="flex-1 h-10 bg-accent text-white hover:bg-accent/90 text-xs font-semibold"
				>
					Gunakan Foto
				</Button>
			</div>
		</div>
	);
}
