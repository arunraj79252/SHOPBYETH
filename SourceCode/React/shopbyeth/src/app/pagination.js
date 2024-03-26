import React, { useEffect } from 'react';
import { usePagination, DOTS } from './usePagination';
import { Link } from 'react-router-dom';
import Pagination from 'react-bootstrap/Pagination';
const Paginations = props => {
  const {
    onPageChange,
    totalCount,
    siblingCount = 1,
    currentPage,
    pageSize,
    className
  } = props;


  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize
  });


  if (currentPage === 0 || paginationRange.length < 2) {
    return null;
  }

  const onNext = () => {
    onPageChange(currentPage + 1);
  };

  const onPrevious = () => {
    onPageChange(currentPage - 1);
  };

  let lastPage = paginationRange[paginationRange.length - 1];
//   return (

//     <ul
//       className="pagination"
//     >
//       {/* <li
//         className={classnames('pagination-item', {
//           disabled: currentPage === 1
//         })}
//         onClick={onPrevious}
//       >
//         <div className="arrow left" />
//       </li> */}
//       <li class="page-item">
//       <Link class="page-link"  aria-label="Previous">
//         <span aria-hidden="true">&laquo;</span>
//       </Link>
//     </li>
//       {paginationRange.map(pageNumber => {
//         if (pageNumber === DOTS) {
//           return <li className="pagination-item">&#8230;</li>;
//         }

//         return (
//           <li
//             className= "pagination-item"
//             onClick={() => onPageChange(pageNumber)}
//           >
//             {pageNumber} 
//           </li>
//         );
//       })}
//       {/* <li
//         className={classnames('pagination-item', {
//           disabled: currentPage === lastPage
//         })}
//         onClick={onNext}
//       >
//         <div className="arrow right" />
//       </li> */}
//       <li class="page-item">
//       <Link class="page-link"  aria-label="Next">
//         <span aria-hidden="true">&raquo;</span>
//       </Link>
//     </li>
//     </ul>

//   );
  return(
    <Pagination>
    <Pagination.Prev disabled={currentPage === 1} onClick={onPrevious} />
    {paginationRange.map(res =>{
      if (res === DOTS) {
          return <Pagination.Ellipsis disabled />

      }
      return(
          <Pagination.Item  onClick={() => onPageChange(res)}  active={currentPage === res}>{res}</Pagination.Item>
      )
    })}

    <Pagination.Next disabled={currentPage === lastPage} onClick={onNext}/>
  </Pagination>
  )
};

export default Paginations;

