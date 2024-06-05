import React, { useMemo } from 'react';
import { ILinkDefaultProps, IPosition } from '@mrblenny/react-flow-chart';
import { useTheme } from 'hooks/useTheme';
import { LinkProperties } from 'utils/chart';
import LinkContextMenu from '../LinkContextMenu';

export const generateCurvePath = (startPos: IPosition, endPos: IPosition): string => {
  const width = Math.abs(startPos.x - endPos.x);
  const height = Math.abs(startPos.y - endPos.y);
  const leftToRight = startPos.x < endPos.x;
  const topToBottom = startPos.y < endPos.y;
  const isHorizontal = width > height;

  let start;
  let end;
  if (isHorizontal) {
    start = leftToRight ? startPos : endPos;
    end = leftToRight ? endPos : startPos;
  } else {
    start = topToBottom ? startPos : endPos;
    end = topToBottom ? endPos : startPos;
  }

  const curve = isHorizontal ? width / 3 : height / 3;
  const curveX = isHorizontal ? curve : 0;
  const curveY = isHorizontal ? 0 : curve;

  // add 0.001 to the last point's coords to workaround gradients disappearing
  // when rendered as a straight line. See https://stackoverflow.com/a/34687362
  return `M${start.x},${start.y} C ${start.x + curveX},${start.y + curveY} ${
    end.x - curveX
  },${end.y - curveY} ${end.x + 0.001},${end.y + 0.001}`;
};

const CustomLink: React.FC<ILinkDefaultProps> = ({
  config,
  link,
  startPos,
  endPos,
  onLinkMouseEnter,
  onLinkMouseLeave,
  onLinkClick,
  isHovered,
  isSelected,
}) => {
  const points = generateCurvePath(startPos, endPos);
  const theme = useTheme();

  // memoize these calculations for a bit of perf
  const { leftStop, rightStop, leftColor, rightColor, opacity, dashed } = useMemo(() => {
    // use two stops in the middle to keep a small gradient in between
    let [leftStop, rightStop] = [45, 55];
    // default colors to gray for backend nodes
    let leftColor = theme.link.default;
    let rightColor = theme.link.default;
    let dashed = false;
    let opacity = 1;
    if (link.properties) {
      const { type, direction, toBalance, capacity, isPrivate, assets } =
        link.properties as LinkProperties;

      if (isPrivate && !assets) opacity = 0.5;

      if (type === 'open-channel' || type === 'pending-channel') {
        let primaryColor = theme.channel.bitcoin.local;
        let secondaryColor = theme.channel.bitcoin.remote;
        let to = BigInt(toBalance);
        let total = BigInt(capacity);
        // use the first asset if available
        if (assets?.length) {
          to = BigInt(assets[0].remoteBalance);
          total = BigInt(assets[0].capacity);
          primaryColor = theme.channel.asset.local;
          secondaryColor = theme.channel.asset.remote;
        }
        // calculate the pct of the channel on the remote side
        const split = Number((to * BigInt(100)) / total);
        // swap colors and stops if the visual direction of the chanel is right to left
        if (direction === 'rtl') {
          // show primary color from the right initiator node to left
          leftColor = secondaryColor;
          rightColor = primaryColor;
          leftStop = Math.max(split - 2, 0);
          rightStop = Math.min(split + 2, 100);
        } else {
          // show primary color from the left initiator node to right
          leftColor = primaryColor;
          rightColor = secondaryColor;
          leftStop = Math.max(100 - split - 2, 0);
          rightStop = Math.min(100 - split + 2, 100);
        }

        if (type === 'pending-channel') {
          dashed = true;
          opacity = 0.5;
        }
      }
    }
    return {
      leftStop,
      rightStop,
      leftColor,
      rightColor,
      opacity,
      dashed,
    };
  }, [link.properties, theme]);

  // use link id since the gradient element must be unique in the dom
  const gradientId = `lg-${link.id}`;

  return (
    <LinkContextMenu link={link}>
      <svg
        style={{
          overflow: 'visible',
          position: 'absolute',
          cursor: 'pointer',
          left: 0,
          right: 0,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={leftColor} />
            <stop offset={`${leftStop}%`} stopColor={leftColor} />
            <stop offset={`${rightStop}%`} stopColor={rightColor} />
            <stop offset="100%" stopColor={rightColor} />
          </linearGradient>
        </defs>
        <circle r="4" cx={startPos.x} cy={startPos.y} fill={`url(#${gradientId})`} />
        {/* Main line */}
        <path
          d={points}
          opacity={opacity}
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          strokeDasharray={dashed ? '15,10' : 'none'}
          fill="none"
        />
        {/* Thick line to make selection easier */}
        <path
          d={points}
          stroke={`url(#${gradientId})`}
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
          strokeOpacity={isHovered || isSelected ? 0.1 : 0}
          onMouseEnter={() => onLinkMouseEnter({ config, linkId: link.id })}
          onMouseLeave={() => onLinkMouseLeave({ config, linkId: link.id })}
          onClick={e => {
            onLinkClick({ config, linkId: link.id });
            e.stopPropagation();
          }}
        />
        <circle r="4" cx={endPos.x} cy={endPos.y} fill={`url(#${gradientId})`} />
      </svg>
    </LinkContextMenu>
  );
};

export default CustomLink;
