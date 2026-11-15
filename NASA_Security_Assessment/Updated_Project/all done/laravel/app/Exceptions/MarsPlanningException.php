<?php

namespace App\Exceptions;

use RuntimeException;

final class MarsPlanningException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $errorCode = 'PLANNER_ERROR',
        public readonly int $httpStatus = 500,
    ) {
        parent::__construct($message);
    }
}
