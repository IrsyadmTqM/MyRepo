import React from 'react';
import { Composition, Still } from 'remotion';
import { FYPVideo } from './FYPVideo';
import { Sampul } from './Sampul';
import { H, W } from './theme';
import { FPS, Props, hitungAdegan } from './timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="FYP"
      component={FYPVideo}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={FPS * 60}
      defaultProps={{ adegan: [] } as Props}
      calculateMetadata={async () => {
        const adegan = await hitungAdegan();
        return {
          durationInFrames: adegan.reduce((s, a) => s + a.durationInFrames, 0),
          props: { adegan },
        };
      }}
    />
    <Still id="Sampul" component={Sampul} width={W} height={H} />
  </>
);
