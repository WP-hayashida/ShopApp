import { Suspense } from 'react';
import MyPageContents from './my-page-contents';

export default function MyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyPageContents />
    </Suspense>
  );
}
